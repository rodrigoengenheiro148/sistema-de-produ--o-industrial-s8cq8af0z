import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { SimpleZip } from '@/lib/simple-zip'

interface TableDefinition {
  name: string
  fileName: string
  columns: string[]
}

const TABLES: TableDefinition[] = [
  {
    name: 'production',
    fileName: 'producao.csv',
    columns: [
      'id',
      'date',
      'shift',
      'mp_used',
      'sebo_produced',
      'fco_produced',
      'farinheta_produced',
      'losses',
      'factory_id',
      'created_at',
    ],
  },
  {
    name: 'shipping',
    fileName: 'expedicao.csv',
    columns: [
      'id',
      'date',
      'client',
      'product',
      'quantity',
      'unit_price',
      'doc_ref',
      'factory_id',
      'created_at',
    ],
  },
  {
    name: 'quality_records',
    fileName: 'qualidade.csv',
    columns: [
      'id',
      'date',
      'product',
      'acidity',
      'protein',
      'responsible',
      'notes',
      'factory_id',
      'created_at',
    ],
  },
  {
    name: 'acidity_records',
    fileName: 'acidez.csv',
    columns: [
      'id',
      'date',
      'time',
      'responsible',
      'weight',
      'volume',
      'acidity',
      'tank',
      'performed_times',
      'notes',
      'factory_id',
      'created_at',
    ],
  },
  {
    name: 'raw_materials',
    fileName: 'materia_prima.csv',
    columns: [
      'id',
      'date',
      'supplier',
      'type',
      'quantity',
      'unit',
      'notes',
      'factory_id',
      'created_at',
    ],
  },
  {
    name: 'factories',
    fileName: 'fabricas.csv',
    columns: ['id', 'name', 'location', 'manager', 'status', 'created_at'],
  },
]

const escapeCsvField = (value: any): string => {
  if (value === null || value === undefined) {
    return ''
  }

  let stringValue = ''

  if (value instanceof Date) {
    stringValue = format(value, 'yyyy-MM-dd HH:mm:ss')
  } else if (typeof value === 'string') {
    // Check if it's an ISO date
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      const d = new Date(value)
      if (!isNaN(d.getTime())) {
        stringValue = format(d, 'yyyy-MM-dd HH:mm:ss')
      } else {
        stringValue = value
      }
    } else {
      stringValue = value
    }
  } else if (typeof value === 'object') {
    try {
      stringValue = JSON.stringify(value)
    } catch {
      stringValue = '[Object]'
    }
  } else {
    stringValue = String(value)
  }

  // If value contains quotes, commas or newlines, wrap in quotes and escape internal quotes
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

const convertToCsv = (data: any[], columns: string[]): string => {
  // Always generate header row based on defined columns
  const headerRow = columns.map((h) => `"${h}"`).join(',')

  if (!data || data.length === 0) {
    return headerRow
  }

  const rows = data.map((row) => {
    return columns.map((col) => escapeCsvField(row[col])).join(',')
  })

  return [headerRow, ...rows].join('\n')
}

export const fetchAndZipCsvData = async () => {
  const zip = new SimpleZip()

  // Fetch data for all tables in parallel
  const results = await Promise.all(
    TABLES.map(async (table) => {
      const { data, error } = await supabase.from(table.name).select('*')

      if (error) {
        throw new Error(
          `Erro ao buscar dados da tabela ${table.name}: ${error.message}`,
        )
      }

      return {
        fileName: table.fileName,
        csvContent: convertToCsv(data || [], table.columns),
      }
    }),
  )

  // Add files to zip
  results.forEach(({ fileName, csvContent }) => {
    zip.addFile(fileName, csvContent)
  })

  // Generate blob
  const zipBlob = zip.generate()

  // Trigger download
  const url = URL.createObjectURL(zipBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dados_sistema_industrial_${format(new Date(), 'yyyy-MM-dd')}.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
