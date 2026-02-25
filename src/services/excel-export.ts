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

const crc32Table = new Uint32Array(256)
for (let i = 0; i < 256; i++) {
  let c = i
  for (let j = 0; j < 8; j++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  crc32Table[i] = c
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ crc32Table[(crc ^ bytes[i]) & 0xff]
  }
  return (crc ^ 0xffffffff) >>> 0
}

class ZipWriter {
  private files: {
    name: string
    data: Uint8Array
    crc: number
    offset: number
  }[] = []
  private offset = 0
  private output: Uint8Array[] = []

  addFile(name: string, content: string) {
    const data = new TextEncoder().encode(content)
    const crc = crc32(data)
    const nameBytes = new TextEncoder().encode(name)

    const lfh = new Uint8Array(30 + nameBytes.length)
    const dv = new DataView(lfh.buffer)
    dv.setUint32(0, 0x04034b50, true)
    dv.setUint16(4, 20, true)
    dv.setUint16(6, 0, true)
    dv.setUint16(8, 0, true)
    dv.setUint16(10, 0, true)
    dv.setUint16(12, 0x2100, true)
    dv.setUint32(14, crc, true)
    dv.setUint32(18, data.length, true)
    dv.setUint32(22, data.length, true)
    dv.setUint16(26, nameBytes.length, true)
    dv.setUint16(28, 0, true)
    lfh.set(nameBytes, 30)

    this.output.push(lfh, data)
    this.files.push({ name, data, crc, offset: this.offset })
    this.offset += lfh.length + data.length
  }

  generate(): Blob {
    const cdOffset = this.offset
    let cdSize = 0

    for (const f of this.files) {
      const nameBytes = new TextEncoder().encode(f.name)
      const cdfh = new Uint8Array(46 + nameBytes.length)
      const dv = new DataView(cdfh.buffer)
      dv.setUint32(0, 0x02014b50, true)
      dv.setUint16(4, 20, true)
      dv.setUint16(6, 20, true)
      dv.setUint16(8, 0, true)
      dv.setUint16(10, 0, true)
      dv.setUint16(12, 0, true)
      dv.setUint16(14, 0x2100, true)
      dv.setUint32(16, f.crc, true)
      dv.setUint32(20, f.data.length, true)
      dv.setUint32(24, f.data.length, true)
      dv.setUint16(28, nameBytes.length, true)
      dv.setUint16(30, 0, true)
      dv.setUint16(32, 0, true)
      dv.setUint16(34, 0, true)
      dv.setUint16(36, 0, true)
      dv.setUint32(38, 0, true)
      dv.setUint32(42, f.offset, true)
      cdfh.set(nameBytes, 46)
      this.output.push(cdfh)
      cdSize += cdfh.length
    }

    const eocd = new Uint8Array(22)
    const dv = new DataView(eocd.buffer)
    dv.setUint32(0, 0x06054b50, true)
    dv.setUint16(4, 0, true)
    dv.setUint16(6, 0, true)
    dv.setUint16(8, this.files.length, true)
    dv.setUint16(10, this.files.length, true)
    dv.setUint32(12, cdSize, true)
    dv.setUint32(16, cdOffset, true)
    dv.setUint16(20, 0, true)
    this.output.push(eocd)

    return new Blob(this.output, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
  }
}

function escapeXml(str: any): string {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

const generateSheetData = (data: any[]) => {
  if (!data || data.length === 0) {
    return `<sheetData><row><c t="inlineStr"><is><t>Sem dados</t></is></c></row></sheetData>`
  }

  const headers = Object.keys(data[0])
  let rowsXml = `<row>${headers.map((h) => `<c t="inlineStr"><is><t>${escapeXml(h)}</t></is></c>`).join('')}</row>`

  for (const row of data) {
    let cellsXml = ''
    for (const header of headers) {
      let val = row[header]
      if (val === null || val === undefined) {
        cellsXml += `<c t="inlineStr"><is><t></t></is></c>`
      } else if (typeof val === 'number') {
        cellsXml += `<c><v>${val}</v></c>`
      } else {
        if (val instanceof Date) {
          val = format(val, 'dd/MM/yyyy HH:mm')
        } else if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
          const date = new Date(val)
          if (!isNaN(date.getTime())) {
            val = format(date, 'dd/MM/yyyy HH:mm')
          }
        }
        cellsXml += `<c t="inlineStr"><is><t>${escapeXml(String(val))}</t></is></c>`
      }
    }
    rowsXml += `<row>${cellsXml}</row>`
  }

  return `<sheetData>${rowsXml}</sheetData>`
}

function createXlsx(sheets: { name: string; data: any[] }[]): Blob {
  const zip = new ZipWriter()

  let contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>`

  let workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`

  let workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>`

  sheets.forEach((sheet, index) => {
    const sheetId = index + 1
    contentTypes += `\n  <Override PartName="/xl/worksheets/sheet${sheetId}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
    workbookRels += `\n  <Relationship Id="rId${sheetId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${sheetId}.xml"/>`
    workbookXml += `\n    <sheet name="${escapeXml(sheet.name)}" sheetId="${sheetId}" r:id="rId${sheetId}"/>`

    zip.addFile(
      `xl/worksheets/sheet${sheetId}.xml`,
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${generateSheetData(sheet.data)}</worksheet>`,
    )
  })

  contentTypes += '\n</Types>'
  workbookRels += '\n</Relationships>'
  workbookXml += '\n  </sheets>\n</workbook>'

  zip.addFile('[Content_Types].xml', contentTypes)
  zip.addFile(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
  )
  zip.addFile('xl/_rels/workbook.xml.rels', workbookRels)
  zip.addFile('xl/workbook.xml', workbookXml)

  return zip.generate()
}

export const exportDataToExcel = (
  data: any[],
  filename: string,
  sheetName: string,
) => {
  const blob = createXlsx([{ name: sheetName, data }])
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const generateAndDownloadExcel = async () => {
  const sheets = await Promise.all(
    TABLES.map(async ({ tableName, sheetName }) => {
      const { data, error } = await supabase.from(tableName).select('*')
      if (error) throw new Error(`Erro ao buscar dados de ${sheetName}`)
      return { name: sheetName, data: data || [] }
    }),
  )

  const blob = createXlsx(sheets)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dados_sistema_industrial_${format(new Date(), 'yyyy-MM-dd')}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
