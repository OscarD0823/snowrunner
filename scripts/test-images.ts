import { strict as assert } from 'node:assert'
import { existsSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import { basename, dirname, extname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { app, BrowserWindow } from 'electron'

const supported = new Set(['.png', '.webp', '.jpg', '.jpeg', '.ico'])

async function imageFiles(root: string): Promise<string[]> {
	if (!existsSync(root)) return []
	const result: string[] = []

	for (const entry of await readdir(root, { withFileTypes: true })) {
		const fullPath = join(root, entry.name)
		if (entry.isDirectory()) result.push(...await imageFiles(fullPath))
		else if (supported.has(extname(entry.name).toLowerCase())) result.push(fullPath)
	}

	return result
}

async function filesNamed(root: string, name: string): Promise<string[]> {
	if (!existsSync(root)) return []
	const result: string[] = []

	for (const entry of await readdir(root, { withFileTypes: true })) {
		const fullPath = join(root, entry.name)
		if (entry.isDirectory()) result.push(...await filesNamed(fullPath, name))
		else if (entry.name.toLowerCase() === name.toLowerCase()) result.push(fullPath)
	}

	return result
}

async function validate(window: BrowserWindow, root: string) {
	const files = await imageFiles(root)
	const urls = files.map(file => pathToFileURL(file).href)
	const results = await window.webContents.executeJavaScript(`
		Promise.all(${JSON.stringify(urls)}.map(src => new Promise(resolve => {
			const image = new Image()
			image.onload = () => {
				const canvas = document.createElement('canvas')
				canvas.width = 64
				canvas.height = 90
				const context = canvas.getContext('2d', { willReadFrequently: true })
				context.drawImage(image, 0, 0, canvas.width, canvas.height)
				const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
				let difference = 0
				let comparisons = 0
				const compare = (first, second) => {
					difference += Math.abs(pixels[first] - pixels[second])
						+ Math.abs(pixels[first + 1] - pixels[second + 1])
						+ Math.abs(pixels[first + 2] - pixels[second + 2])
					comparisons++
				}
				for (let y = 0; y < canvas.height; y++) {
					for (let x = 0; x < canvas.width; x++) {
						const offset = (y * canvas.width + x) * 4
						if (x + 1 < canvas.width) compare(offset, offset + 4)
						if (y + 1 < canvas.height) compare(offset, offset + canvas.width * 4)
					}
				}
				resolve({ src, width: image.naturalWidth, height: image.naturalHeight, noise: difference / comparisons })
			}
			image.onerror = () => resolve({ src, width: 0, height: 0, noise: Infinity })
			image.src = src
		})))
	`) as Array<{ src: string; width: number; height: number; noise: number }>

	for (const result of results) {
		assert(result.width > 0 && result.height > 0, `La imagen no se puede abrir: ${result.src}`)
	}
	const valid = new Set(files.filter((_, index) => results[index].noise < 50).map(file => resolve(file).toLowerCase()))
	return { total: files.length, valid, rejected: files.length - valid.size }
}

async function catalogXmlFiles(mediaRoot: string) {
	const truckRoots = [join(mediaRoot, 'classes', 'trucks')]
	const dlcRoot = join(mediaRoot, '_dlc')

	if (existsSync(dlcRoot)) {
		for (const entry of await readdir(dlcRoot, { withFileTypes: true })) {
			if (entry.isDirectory()) truckRoots.push(join(dlcRoot, entry.name, 'classes', 'trucks'))
		}
	}

	const result: string[] = []
	for (const root of truckRoots) {
		if (!existsSync(root)) continue
		for (const entry of await readdir(root, { withFileTypes: true })) {
			if (entry.isFile() && extname(entry.name).toLowerCase() === '.xml') {
				result.push(join(root, entry.name))
			}
		}

		const trailers = join(root, 'trailers')
		if (!existsSync(trailers)) continue
		for (const entry of await readdir(trailers, { withFileTypes: true })) {
			if (entry.isFile() && extname(entry.name).toLowerCase() === '.xml') {
				result.push(join(trailers, entry.name))
			}
		}
	}

	return result
}

async function validateInstalledCatalog(workspaceRoot: string, extractedRoot: string, validImages: Set<string>) {
	const mediaRoot = join(workspaceRoot, 'mainTemp', '[media]')
	const baseTrucksRoot = join(mediaRoot, 'classes', 'trucks')
	if (!existsSync(baseTrucksRoot)) return { trucks: 0, trailers: 0, icons: 0 }

	const symbols = new Set<string>()
	for (const indexFile of await filesNamed(extractedRoot, 'index.json')) {
		const index = JSON.parse(await readFile(indexFile, 'utf8')) as Record<string, string>
		for (const [symbol, path] of Object.entries(index)) {
			const original = resolve(path).toLowerCase()
			const relocated = resolve(dirname(indexFile), 'generated', basename(path)).toLowerCase()
			if (validImages.has(original) || validImages.has(relocated)) symbols.add(symbol.toLowerCase())
		}
	}

	let trucks = 0
	let trailers = 0
	let icons = 0
	for (const file of await catalogXmlFiles(mediaRoot)) {
		const xml = await readFile(file, 'utf8')
		if (!/<Truck(?:\s|>)/u.test(xml)) continue
		const isTrailer = /<Truck[^>]*\bType\s*=\s*"Trailer"/u.test(xml)
			|| /[\\/]trucks[\\/]trailers[\\/]/u.test(file)

		if (isTrailer) {
			trailers++
			continue
		}

		trucks++
		const icon = /UiIcon328x458\s*=\s*"([^"]+)"/u.exec(xml)?.[1].toLowerCase()
		assert(icon, `El vehículo no declara carátula oficial: ${file}`)
		if (symbols.has(icon)) icons++
	}

	assert(trucks >= 100, `Solo se detectaron ${trucks} vehículos reales`)
	assert(trailers >= 50, `Solo se detectaron ${trailers} remolques reales`)
	assert(icons >= 60, `Solo se validaron visualmente ${icons} carátulas oficiales`)
	return { trucks, trailers, icons }
}

async function resolveDataRoots(appDataRoot: string) {
	const legacyRoot = join(appDataRoot, 'SnowRunner Studio')
	try {
		const config = JSON.parse(await readFile(join(legacyRoot, 'jsons', 'config.json'), 'utf8')) as { initialPath?: string }
		const normalized = config.initialPath?.replaceAll('/', '\\')
		const marker = '\\preload\\paks\\client\\initial.pak'
		const markerIndex = normalized?.toLowerCase().lastIndexOf(marker) ?? -1
		const gameRoot = normalized && markerIndex >= 0
			? normalized.slice(0, markerIndex)
			: undefined
		const workspace = gameRoot && join(gameRoot, '.snowrunner-studio')
		const catalogRoot = workspace
			&& existsSync(join(workspace, 'mainTemp', '[media]', 'classes'))
			? workspace
			: legacyRoot
		const workspaceImages = workspace && join(workspace, 'game-images')
		const extractedRoot = workspaceImages && existsSync(workspaceImages)
			? workspaceImages
			: join(legacyRoot, 'game-images')

		return { catalogRoot, extractedRoot }
	} catch {
		return {
			catalogRoot: legacyRoot,
			extractedRoot: join(legacyRoot, 'game-images')
		}
	}
}

async function main() {
	await app.whenReady()
	const window = new BrowserWindow({ show: false })
	await window.loadFile(resolve('scripts', 'image-test.html'))
	const bundled = await validate(window, resolve('src', 'images'))
	assert(bundled.total >= 16, `Faltan recursos visuales propios: solo se encontraron ${bundled.total}`)
	assert.equal(bundled.rejected, 0, 'Hay recursos visuales propios dañados')
	assert(existsSync(resolve('src', 'images', 'trucks', 'default.webp')), 'Falta la carátula genérica de vehículos')
	assert(existsSync(resolve('src', 'images', 'trailers', 'default.webp')), 'Falta la carátula genérica de remolques')

	const appDataRoot = process.env.APPDATA
	const dataRoots = appDataRoot ? await resolveDataRoots(appDataRoot) : undefined
	const extractedRoot = dataRoots?.extractedRoot ?? ''
	const extracted = extractedRoot
		? await validate(window, extractedRoot)
		: { total: 0, valid: new Set<string>(), rejected: 0 }
	let catalog = { trucks: 0, trailers: 0, icons: 0 }
	if (existsSync(extractedRoot)) {
		assert(extracted.valid.size >= 60, `Solo se validaron visualmente ${extracted.valid.size} carátulas extraídas`)
		catalog = await validateInstalledCatalog(dataRoots!.catalogRoot, extractedRoot, extracted.valid)
	}

	console.log(`Imágenes SnowRunner: ${bundled.total} recursos propios; ${extracted.valid.size} carátulas extraídas válidas y ${extracted.rejected} antiguas rechazadas. Catálogo: ${catalog.trucks} vehículos, ${catalog.trailers} remolques y ${catalog.icons} referencias oficiales verificadas.`)
	window.destroy()
	app.quit()
}

void main().catch(error => {
	console.error(error)
	app.exit(1)
})
