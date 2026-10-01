const { app, nativeImage } = require('electron')
const { mkdir, writeFile } = require('node:fs/promises')
const { join } = require('node:path')

async function main() {
	const root = join(__dirname, '..')
	const source = join(root, 'src', 'images', 'favicon.ico')
	const output = join(root, 'src', 'store-assets')

	await app.whenReady()
	await mkdir(output, { recursive: true })

	const icon = nativeImage.createFromPath(source)
	if (icon.isEmpty()) throw new Error(`No se pudo abrir ${source}`)

	for (const [name, size] of [
		['icon.png', 50],
		['Square44x44Logo.png', 44],
		['Square150x150Logo.png', 150]
	]) {
		await writeFile(join(output, name), icon.resize({ width: size, height: size, quality: 'best' }).toPNG())
	}

	app.exit(0)
}

main().catch(error => {
	console.error(error)
	app.exit(1)
})
