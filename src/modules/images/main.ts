import { nativeImage } from 'electron'
import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, join, win32 } from 'node:path'
import { promisify } from 'node:util'
import { inject } from '@utilities/di/container'
import { PATHS_TOKEN } from '@utilities/di/main/tokens'
import type { IPaths } from '@modules/paths/types'
import type { IMainImages } from './types'

type GfxTag = { code: number; data: Buffer }

const execFileAsync = promisify(execFile)
const BUNDLE_ENTRY = '[gfx]\\gfxbundle.gfxbundle'
const TEXTURE_PREFIX = '[textures]\\ui\\flash_auto'

/** Extrae las carátulas originales desde la instalación local del juego. */
export class Images implements IMainImages {
	@inject(PATHS_TOKEN)
	private readonly paths!: IPaths

	async prepare(initialPath: string): Promise<Record<string, string>> {
		const gfxPath = join(dirname(initialPath), 'gfx.pak')
		const gfxStats = await stat(gfxPath)
		const signature = createHash('sha256')
			.update(`snowrunner-shop-v1:${gfxStats.size}:${Math.trunc(gfxStats.mtimeMs)}`)
			.digest('hex')
		const root = join(this.paths.workspace, 'game-images', signature)
		const extracted = join(root, 'extracted')
		const generated = join(root, 'generated')
		const indexPath = join(root, 'index.json')

		try {
			return JSON.parse(await readFile(indexPath, 'utf8')) as Record<string, string>
		} catch {
			await mkdir(extracted, { recursive: true })
			await mkdir(generated, { recursive: true })
		}

		await this.extract(gfxPath, extracted, [BUNDLE_ENTRY])
		const bundle = await this.readExtracted(extracted, BUNDLE_ENTRY)
		const library = this.readBundleFile(bundle, 'trucks_img_lib.gfx')
		const symbolTextures = this.readSymbolTextures(library)
		const textureNames = [...new Set(Object.values(symbolTextures))]

		await this.extract(
			gfxPath,
			extracted,
			textureNames.map(name => `${TEXTURE_PREFIX}\\${name}`)
		)

		const result: Record<string, string> = {}
		for (const [symbol, textureName] of Object.entries(symbolTextures)) {
			if (!symbol.toLowerCase().startsWith('shopimg')) continue

			const outputPath = join(generated, `${symbol.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}.png`)
			const png = this.decodePct(await this.readExtracted(extracted, `${TEXTURE_PREFIX}\\${textureName}`))
			if (!png) continue

			await writeFile(outputPath, png)
			result[symbol.toLowerCase()] = outputPath
		}

		await writeFile(indexPath, JSON.stringify(result, null, 2), 'utf8')
		return result
	}

	private async readExtracted(root: string, entry: string) {
		const candidates = [
			join(root, win32.basename(entry)),
			join(root, ...entry.split('\\'))
		]

		for (const candidate of candidates) {
			try {
				return await readFile(candidate)
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
			}
		}

		throw new Error(`No se pudo extraer ${entry} desde gfx.pak.`)
	}

	private async extract(archive: string, target: string, entries: string[]) {
		if (entries.length === 0) return

		await execFileAsync(
			join(this.paths.winrar, 'WinRAR.exe'),
			['x', '-y', '-ibck', '-inul', archive, ...entries, `${target}\\`],
			{ cwd: this.paths.winrar, windowsHide: true }
		)
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
		if (content.length < 88 || content.toString('ascii', 6, 10) !== 'TCIP') return

		const width = content.readUInt32LE(16)
		const storedHeight = content.readUInt32LE(20)
		const blocks = Math.ceil(width / 4) * Math.ceil(storedHeight / 4)
		const available = content.length - 88
		const format = available === blocks * 8
			? 'bc1'
			: available === blocks * 16
				? 'bc3'
				: undefined
		if (!format) return

		const rgba = this.decodeBlocks(content.subarray(82), width, storedHeight, format)
		for (let index = 0; index < rgba.length; index += 4) {
			const red = rgba[index]
			rgba[index] = rgba[index + 2]
			rgba[index + 2] = red
		}

		const image = nativeImage.createFromBitmap(rgba, { width, height: storedHeight })
		const visibleHeight = width === 328 && storedHeight === 460 ? 458 : storedHeight
		return image.crop({ x: 0, y: 0, width, height: visibleHeight }).toPNG()
	}

	private decodeBlocks(content: Buffer, width: number, height: number, format: 'bc1' | 'bc3') {
		const rgba = Buffer.alloc(width * height * 4)
		const bytesPerBlock = format === 'bc1' ? 8 : 16
		const blocksWide = Math.ceil(width / 4)
		const blocksHigh = Math.ceil(height / 4)

		for (let blockY = 0; blockY < blocksHigh; blockY++) {
			for (let blockX = 0; blockX < blocksWide; blockX++) {
				const offset = (blockY * blocksWide + blockX) * bytesPerBlock
				const alpha = format === 'bc3' ? this.decodeBc3Alpha(content, offset) : undefined
				const colorOffset = offset + (format === 'bc3' ? 8 : 0)
				const colors = this.decodeBcColors(content, colorOffset, format === 'bc1')
				const colorBits = content.readUInt32LE(colorOffset + 4)

				for (let pixel = 0; pixel < 16; pixel++) {
					const x = blockX * 4 + pixel % 4
					const y = blockY * 4 + Math.floor(pixel / 4)
					if (x >= width || y >= height) continue

					const color = colors[(colorBits >>> (pixel * 2)) & 3]
					const target = (y * width + x) * 4
					rgba[target] = color[0]
					rgba[target + 1] = color[1]
					rgba[target + 2] = color[2]
					rgba[target + 3] = alpha?.[pixel] ?? color[3]
				}
			}
		}
		return rgba
	}

	private decodeBcColors(content: Buffer, offset: number, allowTransparent: boolean) {
		const color0 = content.readUInt16LE(offset)
		const color1 = content.readUInt16LE(offset + 2)
		const first = this.rgb565(color0)
		const second = this.rgb565(color1)
		const colors: Array<[number, number, number, number]> = [[...first, 255], [...second, 255], [0, 0, 0, 255], [0, 0, 0, 255]]

		if (color0 > color1 || !allowTransparent) {
			colors[2] = first.map((value, index) => Math.round((2 * value + second[index]) / 3)).concat(255) as [number, number, number, number]
			colors[3] = first.map((value, index) => Math.round((value + 2 * second[index]) / 3)).concat(255) as [number, number, number, number]
		} else {
			colors[2] = first.map((value, index) => Math.round((value + second[index]) / 2)).concat(255) as [number, number, number, number]
			colors[3] = [0, 0, 0, 0]
		}
		return colors
	}

	private decodeBc3Alpha(content: Buffer, offset: number) {
		const alpha0 = content[offset]
		const alpha1 = content[offset + 1]
		const table = [alpha0, alpha1, 0, 0, 0, 0, 0, 0]
		if (alpha0 > alpha1) {
			for (let index = 1; index <= 6; index++) table[index + 1] = Math.round(((7 - index) * alpha0 + index * alpha1) / 7)
		} else {
			for (let index = 1; index <= 4; index++) table[index + 1] = Math.round(((5 - index) * alpha0 + index * alpha1) / 5)
			table[6] = 0
			table[7] = 255
		}

		let bits = 0n
		for (let index = 0; index < 6; index++) bits |= BigInt(content[offset + 2 + index]) << BigInt(index * 8)
		return Array.from({ length: 16 }, (_, index) => table[Number((bits >> BigInt(index * 3)) & 7n)])
	}

	private rgb565(value: number): [number, number, number] {
		return [
			Math.round(((value >> 11) & 31) * 255 / 31),
			Math.round(((value >> 5) & 63) * 255 / 63),
			Math.round((value & 31) * 255 / 31)
		]
	}
}
