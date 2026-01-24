import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'

interface ExportConfig {
  tableName: string
  sheetName: string
}

const TABLES: ExportConfig[] = [
  { tableName: 'production', sheetName: 'Produção' },
  { tableName: 'shipping', sheetName: 'Expedição' },
  { tableName: 'quality_records', sheetName: 'Qualidade' },
  { tableName: 'acidity_records', sheetName: 'Acidez' },
  { tableName: 'raw_materials', sheetName: 'Matéria-Prima' },
  { tableName: 'factories', sheetName: 'Fábricas' },
]

const escapeXml = (str: any): string => {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não'

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const date = new Date(value)
    if (!isNaN(date.getTime())) {
      return format(date, 'dd/MM/yyyy HH:mm')
    }
  }
  return String(value)
}

const generateWorksheet = (sheetName: string, data: any[]) => {
  if (!data || data.length === 0) {
    return ` <Worksheet ss:Name="${sheetName}"><Table><Row><Cell><Data ss:Type="String">Sem dados</Data></Cell></Row></Table></Worksheet>`
  }

  const headers = Object.keys(data[0])
  const headerRow = `<Row>${headers.map((h) => `<Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`).join('')}</Row>`

  const rows = data
    .map((row) => {
      const cells = headers
        .map((header) => {
          const val = row[header]
          const type = typeof val === 'number' ? 'Number' : 'String'
          const formattedVal =
            typeof val === 'number' ? val : escapeXml(formatValue(val))
          return `<Cell><Data ss:Type="${type}">${formattedVal}</Data></Cell>`
        })
        .join('')
      return `<Row>${cells}</Row>`
    })
    .join('')

  return `
 <Worksheet ss:Name="${sheetName}">
  <Table>
   ${headerRow}
   ${rows}
  </Table>
 </Worksheet>`
}

export const generateAndDownloadExcel = async () => {
  const workbookBody = (
    await Promise.all(
      TABLES.map(async ({ tableName, sheetName }) => {
        const { data, error } = await supabase.from(tableName).select('*')
        if (error) throw new Error(`Erro ao buscar dados de ${sheetName}`)
        return generateWorksheet(sheetName, data || [])
      }),
    )
  ).join('')

  const xmlContent = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
${workbookBody}
</Workbook>`

  const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dados_sistema_industrial_${format(new Date(), 'yyyy-MM-dd')}.xls`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
