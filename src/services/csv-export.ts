import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { SimpleZip } from '@/lib/simple-zip'

interface TableDefinition {
  name: string
  fileName: string
}

const TABLES: TableDefinition[] = [
  { name: 'production', fileName: 'producao.csv' },
  { name: 'shipping', fileName: 'expedicao.csv' },
  { name: 'quality_records', fileName: 'qualidade.csv' },
  { name: 'acidity_records', fileName: 'acidez.csv' },
  { name: 'raw_materials', fileName: 'materia_prima.csv' },
  { name: 'factories', fileName: 'fabricas.csv' },
]

const escapeCsvField = (value: any): string => {
  if (value === null || value === undefined) {
    return ''
  }

  let stringValue = ''

  if (value instanceof Date) {
    stringValue = format(value, 'yyyy-MM-dd HH:mm:ss')
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

const convertToCsv = (data: any[]): string => {
  if (!data || data.length === 0) {
    return ''
  }

  // Get headers from the first object, excluding internal or sensitive fields if needed
  // We exclude 'user_id' as per user story recommendation
  const headers = Object.keys(data[0]).filter((key) => key !== 'user_id')

  const headerRow = headers.map((h) => `"${h}"`).join(',')

  const rows = data.map((row) => {
    return headers.map((header) => escapeCsvField(row[header])).join(',')
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
        csvContent: convertToCsv(data || []),
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
