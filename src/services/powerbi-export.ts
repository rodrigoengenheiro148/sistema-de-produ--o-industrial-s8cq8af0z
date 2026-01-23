import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'

const generateCSV = (data: any[]): string => {
  if (!data || !data.length) return ''
  const headers = Object.keys(data[0])
  const csvRows = [
    headers.join(','),
    ...data.map((row) => {
      return headers
        .map((fieldName) => {
          const val = row[fieldName]
          const escaped = ('' + (val ?? '')).replace(/"/g, '""')
          return `"${escaped}"`
        })
        .join(',')
    }),
  ]
  return csvRows.join('\n')
}

const downloadFile = (
  filename: string,
  content: string,
  type: string = 'text/csv',
) => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const getDAXMeasures = () => {
  return `
/* 
  Power BI DAX Measures 
  Generated for Sistema de Produção Industrial
  
  Instructions:
  1. Import the CSV files into Power BI.
  2. Ensure table names in Power BI match the ones used below (production, shipping, quality_records, acidity_records).
  3. Copy and paste these measures into your measure table or create them individually.
*/

/* KPI: Produção Total (Kg) */
Total Production = SUM('production'[fco_produced]) + SUM('production'[farinheta_produced]) + SUM('production'[sebo_produced])

/* KPI: Rendimento Industrial (%) */
/* Note: Ensure 'mp_used' exists in production table and is related to Total Production context */
Industrial Yield = DIVIDE([Total Production], SUM('production'[mp_used]), 0)

/* KPI: Receita Total (R$) */
Total Revenue = SUMX('shipping', 'shipping'[quantity] * 'shipping'[unit_price])

/* KPI: Médias de Qualidade */
Average Protein = AVERAGE('quality_records'[protein])
Average Acidity (Quality Check) = AVERAGE('quality_records'[acidity])
Average Acidity (Tank Check) = AVERAGE('acidity_records'[acidity])
`
}

export const fetchAndExportPowerBIData = async () => {
  const timestamp = format(new Date(), 'yyyyMMdd_HHmm')
  const tables = [
    'production',
    'shipping',
    'quality_records',
    'acidity_records',
    'raw_materials',
    'factories',
  ]

  // Download CSVs
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*')
    if (error) throw new Error(`Error fetching ${table}: ${error.message}`)

    if (data && data.length > 0) {
      const csv = generateCSV(data)
      downloadFile(`powerbi_data_${table}_${timestamp}.csv`, csv)
      // Delay to prevent browser blocking multiple downloads
      await new Promise((resolve) => setTimeout(resolve, 800))
    }
  }

  // Download DAX Measures
  const dax = getDAXMeasures()
  downloadFile(`industrial_measures_${timestamp}.dax`, dax, 'text/plain')
}
