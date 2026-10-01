import { strict as assert } from 'node:assert'
import { existsSync, readFileSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { app, nativeImage } from 'electron'

import { Images } from '../src/modules/images/main'
import type { IPaths } from '../src/modules/paths/types'
import { di } from '../src/utilities/di/container'
import { PATHS_TOKEN } from '../src/utilities/di/main/tokens'

function installedInitialPath() {
	if (process.env.SNOWRUNNER_INITIAL_PATH) return resolve(process.env.SNOWRUNNER_INITIAL_PATH)
	const appData = process.env.APPDATA
	if (!appData) return

	try {
		const config = JSON.parse(readFileSync(join(appData, 'SnowRunner Studio', 'jsons', 'config.json'), 'utf8')) as {
			initialPath?: string
		}
		return config.initialPath
	} catch {
		return
	}
}

function noiseScore(path: string) {
	const image = nativeImage.createFromPath(path).resize({ width: 64, height: 90, quality: 'good' })
	const { width, height } = image.getSize()
	const pixels = image.toBitmap()
	let difference = 0
	let comparisons = 0
	const compare = (first: number, second: number) => {
		difference += Math.abs(pixels[first] - pixels[second])
			+ Math.abs(pixels[first + 1] - pixels[second + 1])
			+ Math.abs(pixels[first + 2] - pixels[second + 2])
		comparisons++
	}

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const offset = (y * width + x) * 4
			if (x + 1 < width) compare(offset, offset + 4)
			if (y + 1 < height) compare(offset, offset + width * 4)
		}
	}
	return difference / comparisons
}

async function main() {
	await app.whenReady()
	const initialPath = installedInitialPath()
	const gfxPath = initialPath && join(dirname(initialPath), 'gfx.pak')
	if (!initialPath || !gfxPath || !existsSync(initialPath) || !existsSync(gfxPath)) {
		console.log('Prueba PCT omitida: no hay una instalación local completa de SnowRunner.')
		app.quit()
		return
	}

	const workspace = process.env.SNOWRUNNER_PCT_WORKSPACE
		? resolve(process.env.SNOWRUNNER_PCT_WORKSPACE)
		: resolve('.vite', 'pct-image-smoke')
	if (!process.env.SNOWRUNNER_PCT_WORKSPACE) {
		await rm(workspace, { recursive: true, force: true })
	}
	di.register(PATHS_TOKEN, { workspace } as IPaths)
	const images = await new Images().prepare(initialPath)
	const entries = Object.entries(images)
	assert(entries.length >= 100, `Solo se extrajeron ${entries.length} carátulas desde gfx.pak`)

	const invalid = entries.filter(([, path]) => {
		const image = nativeImage.createFromPath(path)
		const { width, height } = image.getSize()
		return image.isEmpty() || width !== 328 || height < 458 || noiseScore(path) >= 50
	})
	assert.equal(invalid.length, 0, `Hay carátulas PCT dañadas: ${invalid.map(([name]) => name).join(', ')}`)

	console.log(`PCT SnowRunner: ${entries.length} carátulas reales extraídas de gfx.pak y verificadas visualmente.`)
	app.quit()
}

void main().catch(error => {
	console.error(error)
	app.exit(1)
})
