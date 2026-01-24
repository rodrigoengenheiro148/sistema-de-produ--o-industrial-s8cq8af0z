/**
 * A minimal ZIP file generator for the browser.
 * Creates uncompressed ZIP archives.
 */

const crc32 = (r: number, v: Uint8Array) => {
  for (let i = 0; i < v.length; i++) {
    r ^= v[i]
    for (let j = 0; j < 8; j++) {
      r = (r >>> 1) ^ (0xedb88320 & -(r & 1))
    }
  }
  return r ^ 0xffffffff
}

const getCrc32 = (data: Uint8Array) => {
  return crc32(0xffffffff, data) ^ 0xffffffff
}

interface ZipFile {
  name: string
  data: Uint8Array
  crc: number
  size: number
}

export class SimpleZip {
  private files: ZipFile[] = []

  public addFile(name: string, content: string | Uint8Array) {
    const data =
      typeof content === 'string' ? new TextEncoder().encode(content) : content
    const crc = getCrc32(data)
    this.files.push({
      name,
      data,
      crc,
      size: data.length,
    })
  }

  public generate(): Blob {
    const parts: Uint8Array[] = []
    let offset = 0
    const centralDirectory: Uint8Array[] = []

    // Local File Headers & Data
    for (const file of this.files) {
      const nameBytes = new TextEncoder().encode(file.name)

      // Local File Header Signature
      const header = new Uint8Array(30 + nameBytes.length)
      const view = new DataView(header.buffer)

      view.setUint32(0, 0x04034b50, true) // Signature
      view.setUint16(4, 0x000a, true) // Version needed
      view.setUint16(6, 0x0000, true) // Flags
      view.setUint16(8, 0x0000, true) // Compression (0 = Store)
      view.setUint16(10, 0x0000, true) // Time (placeholder)
      view.setUint16(12, 0x0000, true) // Date (placeholder)
      view.setUint32(14, file.crc, true) // CRC32
      view.setUint32(18, file.size, true) // Compressed size
      view.setUint32(22, file.size, true) // Uncompressed size
      view.setUint16(26, nameBytes.length, true) // Filename length
      view.setUint16(28, 0, true) // Extra field length

      header.set(nameBytes, 30)

      // Create Central Directory Header for later
      const cdHeader = new Uint8Array(46 + nameBytes.length)
      const cdView = new DataView(cdHeader.buffer)

      cdView.setUint32(0, 0x02014b50, true) // Signature
      cdView.setUint16(4, 0x000a, true) // Version made by
      cdView.setUint16(6, 0x000a, true) // Version needed
      cdView.setUint16(8, 0x0000, true) // Flags
      cdView.setUint16(10, 0x0000, true) // Compression
      cdView.setUint16(12, 0x0000, true) // Time
      cdView.setUint16(14, 0x0000, true) // Date
      cdView.setUint32(16, file.crc, true) // CRC32
      cdView.setUint32(20, file.size, true) // Compressed size
      cdView.setUint32(24, file.size, true) // Uncompressed size
      cdView.setUint16(28, nameBytes.length, true) // Filename length
      cdView.setUint16(30, 0, true) // Extra field length
      cdView.setUint16(32, 0, true) // Comment length
      cdView.setUint16(34, 0, true) // Disk number
      cdView.setUint16(36, 0, true) // Internal attributes
      cdView.setUint32(38, 0, true) // External attributes
      cdView.setUint32(42, offset, true) // Relative offset of local header

      cdHeader.set(nameBytes, 46)

      parts.push(header)
      parts.push(file.data)
      centralDirectory.push(cdHeader)

      offset += header.length + file.data.length
    }

    const cdStartOffset = offset
    let cdSize = 0

    // Append Central Directory
    for (const cd of centralDirectory) {
      parts.push(cd)
      cdSize += cd.length
    }

    // End of Central Directory Record
    const eocd = new Uint8Array(22)
    const eocdView = new DataView(eocd.buffer)

    eocdView.setUint32(0, 0x06054b50, true) // Signature
    eocdView.setUint16(4, 0, true) // Disk number
    eocdView.setUint16(6, 0, true) // Disk number with CD
    eocdView.setUint16(8, this.files.length, true) // Entries in CD on this disk
    eocdView.setUint16(10, this.files.length, true) // Total entries in CD
    eocdView.setUint32(12, cdSize, true) // Size of CD
    eocdView.setUint32(16, cdStartOffset, true) // Offset of CD start
    eocdView.setUint16(20, 0, true) // Comment length

    parts.push(eocd)

    return new Blob(parts, { type: 'application/zip' })
  }
}
