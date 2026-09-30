import { strict as assert } from 'node:assert'
import { existsSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'
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
			image.onload = () => resolve({ src, width: image.naturalWidth, height: image.naturalHeight })
			image.onerror = () => resolve({ src, width: 0, height: 0 })
			image.src = src
		})))
	`) as Array<{ src: string; width: number; height: number }>

	for (const result of results) {
		assert(result.width > 0 && result.height > 0, `La imagen no se puede abrir: ${result.src}`)
	}
	return files.length
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

async function validateInstalledCatalog(workspaceRoot: string, extractedRoot: string) {
	const mediaRoot = join(workspaceRoot, 'mainTemp', '[media]')
	const baseTrucksRoot = join(mediaRoot, 'classes', 'trucks')
	if (!existsSync(baseTrucksRoot)) return { trucks: 0, trailers: 0, icons: 0 }

	const symbols = new Set<string>()
	for (const indexFile of await filesNamed(extractedRoot, 'index.json')) {
		const index = JSON.parse(await readFile(indexFile, 'utf8')) as Record<string, string>
		for (const symbol of Object.keys(index)) symbols.add(symbol.toLowerCase())
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
		assert(symbols.has(icon), `No se extrajo la carátula oficial ${icon} de ${file}`)
		icons++
	}

	assert(trucks >= 100, `Solo se detectaron ${trucks} vehículos reales`)
	assert(trailers >= 50, `Solo se detectaron ${trailers} remolques reales`)
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
	assert(bundled >= 150, `Solo se encontraron ${bundled} imágenes incluidas`)

	const appDataRoot = process.env.APPDATA
	const dataRoots = appDataRoot ? await resolveDataRoots(appDataRoot) : undefined
	const extractedRoot = dataRoots?.extractedRoot ?? ''
	const extracted = extractedRoot ? await validate(window, extractedRoot) : 0
	let catalog = { trucks: 0, trailers: 0, icons: 0 }
	if (existsSync(extractedRoot)) {
		assert(extracted >= 100, `Solo se validaron ${extracted} carátulas extraídas`)
		catalog = await validateInstalledCatalog(dataRoots!.catalogRoot, extractedRoot)
	}

	console.log(`Imágenes SnowRunner: ${bundled} incluidas y ${extracted} extraídas cargan correctamente. Catálogo: ${catalog.trucks} vehículos, ${catalog.trailers} remolques y ${catalog.icons} carátulas oficiales verificadas.`)
	window.destroy()
	app.quit()
}

void main().catch(error => {
	console.error(error)
	app.exit(1)
})
