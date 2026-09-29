import { strict as assert } from 'node:assert'
import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
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

async function main() {
	await app.whenReady()
	const window = new BrowserWindow({ show: false })
	await window.loadFile(resolve('scripts', 'image-test.html'))
	const bundled = await validate(window, resolve('src', 'images'))
	assert(bundled >= 150, `Solo se encontraron ${bundled} imágenes incluidas`)

	const appDataRoot = process.env.APPDATA
	const extractedRoot = appDataRoot
		? join(appDataRoot, 'SnowRunner Studio', 'game-images')
		: ''
	const extracted = extractedRoot ? await validate(window, extractedRoot) : 0
	if (existsSync(extractedRoot)) {
		assert(extracted >= 100, `Solo se validaron ${extracted} carátulas extraídas`)
	}

	console.log(`Imágenes SnowRunner: ${bundled} incluidas y ${extracted} extraídas cargan correctamente.`)
	window.destroy()
	app.quit()
}

void main().catch(error => {
	console.error(error)
	app.exit(1)
})
