import { open, stat } from 'node:fs/promises'
import { inflateRawSync } from 'node:zlib'

type Entry = { offset: number; compressed: number; size: number; method: number }
const indexes = new Map<string, { signature: string; entries: Map<string, Entry> }>()

/** Indexed, bounded reads; never unpacks a whole game archive or changes it. */
export async function readGameEntry(path: string, name: string, limit = 64 * 1024 * 1024) {
  const info = await stat(path)
  const signature = `${info.size}:${info.mtimeMs}`
  const handle = await open(path, 'r')
  async function bytes(offset: number, size: number) {
    if (!Number.isSafeInteger(offset) || offset < 0 || size < 0 || offset + size > info.size) throw new Error('Invalid archive range')
    const buffer = Buffer.alloc(size)
    const result = await handle.read(buffer, 0, size, offset)
    if (result.bytesRead !== size) throw new Error('Truncated game archive')
    return buffer
  }
  try {
    let index = indexes.get(path)
    if (!index || index.signature !== signature) {
      const tail = await bytes(Math.max(0, info.size - 1024 * 1024), Math.min(info.size, 1024 * 1024))
      let end = -1
      for (let i = tail.length - 22; i >= 0; i--) {
        if (tail.readUInt32LE(i) === 0x06054b50 && i + 22 + tail.readUInt16LE(i + 20) <= tail.length) { end = i; break }
      }
      if (end < 0) throw new Error('Game archive has no ZIP directory')
      let size = tail.readUInt32LE(end + 12), offset = tail.readUInt32LE(end + 16)
      if (size === 0xffffffff || offset === 0xffffffff) {
        const zip64 = tail.lastIndexOf(Buffer.from([0x50, 0x4b, 0x06, 0x06]), end)
        if (zip64 < 0 || zip64 + 56 > tail.length) throw new Error('Invalid ZIP64 directory')
        size = Number(tail.readBigUInt64LE(zip64 + 40)); offset = Number(tail.readBigUInt64LE(zip64 + 48))
      }
      if (size > 64 * 1024 * 1024) throw new Error('Archive index exceeds limit')
      const directory = await bytes(offset, size), entries = new Map<string, Entry>()
      let cursor = 0
      while (cursor + 46 <= directory.length && directory.readUInt32LE(cursor) === 0x02014b50) {
        const nl = directory.readUInt16LE(cursor + 28), el = directory.readUInt16LE(cursor + 30), cl = directory.readUInt16LE(cursor + 32)
        const next = cursor + 46 + nl + el + cl
        if (next > directory.length) throw new Error('Truncated ZIP directory')
        const entry: Entry = { method: directory.readUInt16LE(cursor + 10), compressed: directory.readUInt32LE(cursor + 20), size: directory.readUInt32LE(cursor + 24), offset: directory.readUInt32LE(cursor + 42) }
        let extra = cursor + 46 + nl
        while (extra + 4 <= cursor + 46 + nl + el) {
          const tag = directory.readUInt16LE(extra), length = directory.readUInt16LE(extra + 2)
          if (extra + 4 + length > cursor + 46 + nl + el) throw new Error('Invalid ZIP extra field')
          if (tag === 1) {
            let p = extra + 4
            for (const key of ['size', 'compressed', 'offset'] as const) {
              if (entry[key] === 0xffffffff) {
                if (p + 8 > extra + 4 + length) throw new Error('Invalid ZIP64 entry')
                entry[key] = Number(directory.readBigUInt64LE(p)); p += 8
              }
            }
          }
          extra += 4 + length
        }
        const key = directory.toString('utf8', cursor + 46, cursor + 46 + nl).replaceAll('\\', '/').toLowerCase()
        if (!(directory.readUInt16LE(cursor + 8) & 1)) entries.set(key, entry)
        cursor = next
      }
      index = { signature, entries }; indexes.set(path, index)
    }
    const entry = index.entries.get(name.replaceAll('\\', '/').toLowerCase())
    if (!entry) return
    if (!Number.isSafeInteger(entry.size) || entry.size > limit || entry.compressed > limit) throw new Error('Game asset exceeds limit')
    const header = await bytes(entry.offset, 30)
    if (header.readUInt32LE(0) !== 0x04034b50) throw new Error('Invalid ZIP local header')
    const packed = await bytes(entry.offset + 30 + header.readUInt16LE(26) + header.readUInt16LE(28), entry.compressed)
    const result = entry.method === 0 ? packed : entry.method === 8 ? inflateRawSync(packed, { maxOutputLength: limit }) : undefined
    if (!result || result.length !== entry.size) throw new Error('Invalid compressed game asset')
    return result
  } finally { await handle.close() }
}
