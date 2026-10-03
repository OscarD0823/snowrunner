import { nativeImage } from 'electron'
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { access, mkdir, open as openFile, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { inject } from '@utilities/di/container'
import { PATHS_TOKEN } from '@utilities/di/main/tokens'
import type { IPaths } from '@modules/paths/types'
import type { IMainImages } from './types'
import { decodeBC1, decodeBC3, decodeBC4, decodeBC5, decodeBC6H, decodeBC7 } from 'tex-decoder'
import yauzl from 'yauzl'
import { pathToFileURL } from 'node:url'
import { readGameEntry } from './game-archive'
import type { GameMeshAsset } from './types'

type GfxTag = { code: number; data: Buffer }

const BUNDLE_ENTRY = '[gfx]\\gfxbundle.gfxbundle'
const TEXTURE_PREFIX = '[textures]\\ui\\flash_auto'
const MAX_COVER_NOISE = 50
const PCT_DECODERS = new Map<number, {
	blockSize: number
	decode: (content: Uint8Array | Buffer, width: number, height: number) => Uint8Array | Buffer
}>([
	[0x0c, { decode: decodeBC1, blockSize: 8 }],
	[0x11, { decode: decodeBC3, blockSize: 16 }],
	[0x21, { decode: decodeBC5, blockSize: 16 }],
	[0x24, { decode: decodeBC5, blockSize: 16 }],
	[0x25, { decode: decodeBC4, blockSize: 8 }],
	[0x31, { decode: decodeBC6H, blockSize: 16 }],
	[0x33, { decode: decodeBC7, blockSize: 16 }],
	[0x34, { decode: decodeBC7, blockSize: 16 }]
])

class FileRangeReader extends yauzl.RandomAccessReader {
	constructor(private readonly path: string) {
		super()
	}

	override _readStreamForRange(start: number, end: number) {
		return createReadStream(this.path, { start, end: end - 1 })
	}
}

/** Extrae las carátulas originales desde la instalación local del juego. */
export class Images implements IMainImages {
  async prepareMesh(initialPath: string, reference: string): Promise<GameMeshAsset | undefined> {
    if (!/^[a-z0-9_/-]{1,200}$/i.test(reference) || reference.includes('..')) return
    const root = dirname(initialPath), shared = join(root, 'shared.pak'), editor = join(root, 'editor.pak')
    const info = await stat(shared)
    const textureInfo = await stat(editor)
    const signature = createHash('sha256').update(`pbr-v2:${info.size}:${info.mtimeMs}:${textureInfo.size}:${textureInfo.mtimeMs}`).digest('hex').slice(0, 16)
    const folder = join(this.paths.workspace, 'game-models', signature)
    const flat = reference.replaceAll('/', '_'), meshPath = join(folder, flat + '.bin'), indexPath = meshPath + '.json'
    try {
      const cached = JSON.parse(await readFile(indexPath, 'utf8')) as GameMeshAsset
      await access(meshPath)
      return cached
    } catch { /* First view or updated game. */ }
    const mesh = await readGameEntry(shared, `[meshes]/${flat}`)
    if (!mesh) return
    const length = mesh.readInt32LE(0)
    if (length < 3 || length > 1024 * 1024 || length + 2 > mesh.length) throw new Error('Invalid model header')
    const xml = mesh.toString('utf8', 4, length + 2)
    const textures: Record<string, string> = {}
    await mkdir(folder, { recursive: true })
    // Original PBR maps are read locally; no game assets ship in the app.
    const refs = [...new Set([...xml.matchAll(/(?:Albedo|Normal|Shading)Map="([^"]+)"/g)].map(m => m[1]))].slice(0, 128)
    for (const ref of refs) {
      if (!/^[a-z0-9_/. -]{1,200}$/i.test(ref) || ref.includes('..')) continue
      const name = ref.replaceAll('/', '_').replace(/\.tga$/i, '.dds'), output = join(folder, name)
      try {
        await access(output)
      } catch {
        const data = await readGameEntry(editor, `[textures]/dds/${name}`, 32 * 1024 * 1024)
        if (!data) continue
        await writeFile(output, data)
      }
      textures[ref] = pathToFileURL(output).href
    }
    await writeFile(meshPath, mesh)
    const result = { meshUrl: pathToFileURL(meshPath).href, textures }
    await writeFile(indexPath, JSON.stringify(result))
    return result
  }
	@inject(PATHS_TOKEN)
	private readonly paths!: IPaths
	private activePreparation?: { initialPath: string; promise: Promise<Record<string, string>> }

	prepare(initialPath: string): Promise<Record<string, string>> {
		if (this.activePreparation?.initialPath === initialPath) {
			return this.activePreparation.promise
		}

		const promise = this.prepareImages(initialPath).finally(() => {
			if (this.activePreparation?.promise === promise) this.activePreparation = undefined
		})
		this.activePreparation = { initialPath, promise }
		return promise
	}

	private async prepareImages(initialPath: string): Promise<Record<string, string>> {
		const gfxPath = join(dirname(initialPath), 'gfx.pak')
		const cacheRoot = join(this.paths.workspace, 'game-images')
		let gfxStats

		try {
			gfxStats = await stat(gfxPath)
		} catch (error) {
			// Si el juego está temporalmente en otra unidad o Steam todavía no ha
			// montado gfx.pak, se conservan las carátulas válidas ya extraídas.
			const cached = await this.readLatestCache(cacheRoot)
			if (cached) return cached
			throw error
		}
		const signature = createHash('sha256')
			.update(`snowrunner-shop-v2:${gfxStats.size}:${Math.trunc(gfxStats.mtimeMs)}`)
			.digest('hex')
		const root = join(cacheRoot, signature)
		const generated = join(root, 'generated')
		const indexPath = join(root, 'index.json')

		try {
			return await this.readCache(indexPath)
		} catch {
			await mkdir(generated, { recursive: true })
		}

		const bundleEntries = await this.readArchiveFiles(gfxPath, [BUNDLE_ENTRY])
		const bundle = bundleEntries.get(BUNDLE_ENTRY)!
		const library = this.readBundleFile(bundle, 'trucks_img_lib.gfx')
		const symbolTextures = this.readSymbolTextures(library)
		const textureEntries = [...new Set(Object.values(symbolTextures))]
			.map(textureName => `${TEXTURE_PREFIX}\\${textureName}`)
		const textures = await this.readArchiveFiles(gfxPath, textureEntries)

		const result: Record<string, string> = {}
		for (const [symbol, textureName] of Object.entries(symbolTextures)) {
			if (!symbol.toLowerCase().startsWith('shopimg')) continue

			const outputPath = join(generated, `${symbol.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}.png`)
			const pct = textures.get(`${TEXTURE_PREFIX}\\${textureName}`)
			if (!pct) continue
			const png = this.decodePct(pct)
			if (!png) continue

			await writeFile(outputPath, png)
			result[symbol.toLowerCase()] = outputPath
		}

		await writeFile(indexPath, JSON.stringify(result, null, 2), 'utf8')
		return result
	}

	private async readCache(indexPath: string) {
		const cached = JSON.parse(await readFile(indexPath, 'utf8')) as Record<string, string>
		const valid: Record<string, string> = {}
		let rejected = 0

		await Promise.all(Object.entries(cached).map(async ([symbol, path]) => {
			let candidate = path
			try {
				await access(candidate)
			} catch {
				// Las versiones anteriores guardaban rutas absolutas. Recupera la
				// imagen si Steam o el área de trabajo se movieron a otra unidad.
				candidate = join(dirname(indexPath), 'generated', basename(path))
				await access(candidate)
			}

			if (this.isPlausibleCover(candidate)) valid[symbol] = candidate
			else rejected++
		}))

		if (rejected) {
			console.warn(`Se omitieron ${rejected} carátulas antiguas o dañadas de la caché.`)
		}
		return valid
	}

	private async readLatestCache(cacheRoot: string) {
		try {
			const indexes = (await readdir(cacheRoot, { withFileTypes: true }))
				.filter(entry => entry.isDirectory())
				.map(entry => join(cacheRoot, entry.name, 'index.json'))
			const candidates = await Promise.all(indexes.map(async indexPath => {
				try {
					return {
						cached: await this.readCache(indexPath),
						modified: (await stat(indexPath)).mtimeMs
					}
				} catch {
					return undefined
				}
			}))

			return candidates
				.filter(candidate => candidate !== undefined)
				.toSorted((a, b) => b.modified - a.modified)
				.at(0)?.cached
		} catch {
			return undefined
		}
	}

	private async readArchiveFiles(archivePath: string, entryNames: string[]): Promise<Map<string, Buffer>> {
		const wanted = new Map(entryNames.map(name => [name.replaceAll('\\', '/').toLowerCase(), name]))
		const archiveSize = await this.zipContentSize(archivePath)

		return await new Promise((resolve, reject) => {
			const reader = new FileRangeReader(archivePath)
			yauzl.fromRandomAccessReader(reader, archiveSize, {
				autoClose: true,
				lazyEntries: true,
				strictFileNames: false
			}, (openError, archive) => {
				if (openError || !archive) return reject(openError ?? new Error(`No se pudo abrir ${archivePath}`))

				const result = new Map<string, Buffer>()
				archive.on('error', reject)
				archive.on('end', () => {
					if (result.size !== wanted.size) {
						const missing = [...wanted.values()].filter(name => !result.has(name))
						return reject(new Error(`No se encontraron en gfx.pak: ${missing.join(', ')}`))
					}
					resolve(result)
				})
				archive.on('entry', entry => {
					const requested = wanted.get(entry.fileName.toLowerCase())
					if (!requested) return archive.readEntry()

					archive.openReadStream(entry, (streamError, stream) => {
						if (streamError || !stream) return reject(streamError ?? new Error(`No se pudo leer ${entry.fileName}`))
						const chunks: Buffer[] = []
						stream.on('data', chunk => chunks.push(Buffer.from(chunk)))
						stream.on('error', reject)
						stream.on('end', () => {
							result.set(requested, Buffer.concat(chunks))
							archive.readEntry()
						})
					})
				})
				archive.readEntry()
			})
		})
	}

	/**
	 * SnowRunner añade metadatos propios después del cierre ZIP. Yauzl exige
	 * que ese registro sea el último byte, así que le presentamos el tamaño
	 * lógico del ZIP sin copiar ni modificar el .pak original.
	 */
	private async zipContentSize(path: string) {
		const fullSize = (await stat(path)).size
		const tailSize = Math.min(fullSize, 1024 * 1024)
		const handle = await openFile(path, 'r')
		const tail = Buffer.alloc(tailSize)

		try {
			await handle.read(tail, 0, tailSize, fullSize - tailSize)
		} finally {
			await handle.close()
		}

		for (let index = tail.length - 22; index >= 0; index--) {
			if (tail.readUInt32LE(index) !== 0x06054b50) continue
			const commentLength = tail.readUInt16LE(index + 20)
			const logicalSize = fullSize - tailSize + index + 22 + commentLength
			const centralSize = tail.readUInt32LE(index + 12)
			const centralOffset = tail.readUInt32LE(index + 16)
			if (logicalSize <= fullSize && centralOffset + centralSize <= logicalSize) {
				return logicalSize
			}
		}

		return fullSize
	}

	private readBundleFile(bundle: Buffer, requestedName: string) {
		if (bundle.toString('ascii', 0, 4) !== 'S3DB') {
			throw new Error('La biblioteca gráfica de SnowRunner no tiene un formato compatible.')
		}

		const fileCount = bundle.readUInt32LE(11)
		const names: string[] = []
		let cursor = 20
		for (let index = 0; index < fileCount; index++) {
			const length = bundle.readUInt32LE(cursor)
			cursor += 4
			names.push(bundle.toString('utf8', cursor, cursor + length))
			cursor += length
		}

		// Marcador de la tabla de tamaños del contenedor S3DB.
		cursor++
		const sizes = Array.from({ length: fileCount }, (_, index) => (
			bundle.readUInt32LE(cursor + index * 4)
		))
		cursor += fileCount * 4

		const requestedIndex = names.indexOf(requestedName)
		if (requestedIndex < 0) throw new Error(`No se encontró ${requestedName} en gfx.pak.`)

		for (let index = 0; index < requestedIndex; index++) cursor += sizes[index]
		return bundle.subarray(cursor, cursor + sizes[requestedIndex])
	}

	private readSymbolTextures(gfx: Buffer) {
		if (gfx.toString('ascii', 0, 3) !== 'GFX') {
			throw new Error('La biblioteca trucks_img_lib.gfx no es compatible.')
		}

		const tags = this.readTags(gfx, this.gfxTagsOffset(gfx), gfx.length)
		const external = new Map<number, string>()
		const bitmapImages = new Map<number, string>()
		const shapeImages = new Map<number, string>()
		const spriteChildren = new Map<number, number>()
		const symbols = new Map<string, number>()

		for (const tag of tags) {
			if (tag.code === 1009) {
				const match = /trucks_img_lib_i[0-9a-f]+\.tga/i.exec(tag.data.toString('latin1'))
				if (match) external.set(tag.data.readUInt16LE(0), match[0].replace(/\.tga$/i, '.pct'))
			} else if (tag.code === 1008 && tag.data.length >= 4) {
				const image = external.get(tag.data.readUInt16LE(2))
				if (image) bitmapImages.set(tag.data.readUInt16LE(0), image)
			} else if (tag.code === 2) {
				const bitmapId = this.readShapeBitmapId(tag.data)
				const image = bitmapId === undefined
					? undefined
					: bitmapImages.get(bitmapId) ?? external.get(bitmapId)
				if (image) shapeImages.set(tag.data.readUInt16LE(0), image)
			} else if (tag.code === 39) {
				const child = this.readPlacedCharacter(tag.data)
				if (child !== undefined) spriteChildren.set(tag.data.readUInt16LE(0), child)
			} else if (tag.code === 76) {
				let cursor = 2
				const count = tag.data.readUInt16LE(0)
				for (let index = 0; index < count; index++) {
					const characterId = tag.data.readUInt16LE(cursor)
					cursor += 2
					const end = tag.data.indexOf(0, cursor)
					if (end < 0) break
					symbols.set(tag.data.toString('utf8', cursor, end), characterId)
					cursor = end + 1
				}
			}
		}

		const result: Record<string, string> = {}
		for (const [symbol, characterId] of symbols) {
			let current = characterId
			const visited = new Set<number>()
			while (!shapeImages.has(current) && spriteChildren.has(current) && !visited.has(current)) {
				visited.add(current)
				current = spriteChildren.get(current)!
			}
			const image = shapeImages.get(current)
			if (image) result[symbol] = image
		}
		return result
	}

	private gfxTagsOffset(gfx: Buffer) {
		let bit = 64
		const readBits = (count: number) => {
			let value = 0
			for (let index = 0; index < count; index++) {
				value = value * 2 + ((gfx[Math.floor(bit / 8)] >> (7 - bit % 8)) & 1)
				bit++
			}
			return value
		}
		const fieldBits = readBits(5)
		for (let index = 0; index < 4; index++) readBits(fieldBits)
		return Math.ceil(bit / 8) + 4
	}

	private readTags(buffer: Buffer, start: number, end: number): GfxTag[] {
		const result: GfxTag[] = []
		let cursor = start
		while (cursor + 2 <= end) {
			const header = buffer.readUInt16LE(cursor)
			cursor += 2
			const code = header >> 6
			let length = header & 0x3f
			if (length === 0x3f) {
				length = buffer.readUInt32LE(cursor)
				cursor += 4
			}
			if (cursor + length > end) break
			result.push({ code, data: buffer.subarray(cursor, cursor + length) })
			cursor += length
			if (code === 0) break
		}
		return result
	}

	private readShapeBitmapId(shape: Buffer) {
		let bit = 16
		const readBits = (count: number) => {
			let value = 0
			for (let index = 0; index < count; index++) {
				value = value * 2 + ((shape[Math.floor(bit / 8)] >> (7 - bit % 8)) & 1)
				bit++
			}
			return value
		}
		const fieldBits = readBits(5)
		for (let index = 0; index < 4; index++) readBits(fieldBits)
		let cursor = Math.ceil(bit / 8)
		const fillCount = shape[cursor++]
		if (fillCount !== 1 || cursor + 3 > shape.length) return

		const fillType = shape[cursor++]
		return fillType >= 0x40 && fillType <= 0x43
			? shape.readUInt16LE(cursor)
			: undefined
	}

	private readPlacedCharacter(sprite: Buffer) {
		for (const tag of this.readTags(sprite, 4, sprite.length)) {
			if (tag.code === 4 && tag.data.length >= 2) return tag.data.readUInt16LE(0)
			if (tag.code === 26 && tag.data.length >= 5 && (tag.data[0] & 0x02)) {
				return tag.data.readUInt16LE(3)
			}
		}
	}

	private decodePct(content: Buffer) {
		if (content.length < 64 || content.toString('ascii', 6, 10) !== 'TCIP') return

		const width = content.readUInt32LE(16)
		const storedHeight = content.readUInt32LE(20)
		const textureFormat = content.readUInt32LE(38)
		const decoder = PCT_DECODERS.get(textureFormat)
		if (!decoder || width < 1 || storedHeight < 1 || width > 8192 || storedHeight > 8192) return

		let payloadOffset = content.readUInt32LE(54)
		if (payloadOffset + 2 > content.length) return
		if (content[payloadOffset] === 0x04 && content[payloadOffset + 1] === 0x01) {
			payloadOffset += 10
		}
		payloadOffset += 6

		const blocks = Math.ceil(width / 4) * Math.ceil(storedHeight / 4)
		const payloadSize = blocks * decoder.blockSize
		if (payloadOffset + payloadSize > content.length) return

		const decoded = decoder.decode(
			content.subarray(payloadOffset, payloadOffset + payloadSize),
			width,
			storedHeight
		)
		const rgba = Buffer.from(decoded)
		if (rgba.length !== width * storedHeight * 4) return

		// Electron recibe mapas de bits BGRA en Windows; tex-decoder devuelve RGBA.
		for (let index = 0; index < rgba.length; index += 4) {
			const red = rgba[index]
			rgba[index] = rgba[index + 2]
			rgba[index + 2] = red
		}

		const image = nativeImage.createFromBitmap(rgba, { width, height: storedHeight })
		if (image.isEmpty() || !this.isPlausibleImage(image)) return
		const visibleHeight = width === 328 && storedHeight === 460 ? 458 : storedHeight
		return image.crop({ x: 0, y: 0, width, height: visibleHeight }).toPNG()
	}

	private isPlausibleCover(path: string) {
		const image = nativeImage.createFromPath(path)
		return !image.isEmpty() && this.isPlausibleImage(image)
	}

	/** Evita que texturas comprimidas con un códec erróneo se muestren como ruido RGB. */
	private isPlausibleImage(source: Electron.NativeImage) {
		const image = source.resize({ width: 64, height: 90, quality: 'good' })
		const { width, height } = image.getSize()
		const bitmap = image.toBitmap()
		let totalDifference = 0
		let comparisons = 0

		const difference = (first: number, second: number) => (
			Math.abs(bitmap[first] - bitmap[second])
			+ Math.abs(bitmap[first + 1] - bitmap[second + 1])
			+ Math.abs(bitmap[first + 2] - bitmap[second + 2])
		)

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const offset = (y * width + x) * 4
				if (x + 1 < width) {
					totalDifference += difference(offset, offset + 4)
					comparisons++
				}
				if (y + 1 < height) {
					totalDifference += difference(offset, offset + width * 4)
					comparisons++
				}
			}
		}

		return comparisons > 0 && totalDifference / comparisons < MAX_COVER_NOISE
	}
}
