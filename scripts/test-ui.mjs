import { spawn } from 'node:child_process'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = dirname(dirname(fileURLToPath(import.meta.url)))
const exe = process.env.SNOWRUNNER_APP_EXE || join(repo, 'out', 'SnowRunner Studio-win32-x64', 'SnowRunner Studio.exe')
const outputDir = join(repo, '.vite', 'ui-smoke')
const appData = join(outputDir, 'appdata')
const port = 9333

await rm(outputDir, { recursive: true, force: true })
await mkdir(appData, { recursive: true })

const child = spawn(exe, [`--remote-debugging-port=${port}`, `--user-data-dir=${appData}`, '--no-first-run'], {
	env: { ...process.env, APPDATA: appData, SNOWRUNNER_DATA_ROOT: appData },
	stdio: 'ignore',
	windowsHide: true
})

async function getTarget() {
	for (let attempt = 0; attempt < 80; attempt++) {
		try {
			const targets = await fetch(`http://127.0.0.1:${port}/json`).then(response => response.json())
			const page = targets.find(target => target.type === 'page' && target.webSocketDebuggerUrl)
			if (page) return page
		} catch {}
		await new Promise(resolve => setTimeout(resolve, 125))
	}
	throw new Error('La aplicación no expuso la página de prueba.')
}

const target = await getTarget()
const socket = new WebSocket(target.webSocketDebuggerUrl)
const waiting = new Map()
let sequence = 0

socket.addEventListener('message', event => {
	const message = JSON.parse(event.data)
	if (!message.id) return
	const request = waiting.get(message.id)
	if (!request) return
	waiting.delete(message.id)
	if (message.error) request.reject(new Error(message.error.message))
	else request.resolve(message.result)
})

await new Promise((resolve, reject) => {
	socket.addEventListener('open', resolve, { once: true })
	socket.addEventListener('error', reject, { once: true })
})

function call(method, params = {}) {
	const id = ++sequence
	return new Promise((resolve, reject) => {
		waiting.set(id, { resolve, reject })
		socket.send(JSON.stringify({ id, method, params }))
	})
}

await call('Page.enable')
await call('Runtime.enable')

// Espera a que Vue pinte la animación, sin confundir la página HTML vacía con
// un fotograma válido.
for (let attempt = 0; attempt < 40; attempt++) {
	const state = await call('Runtime.evaluate', {
		expression: `Boolean(document.querySelector('.wrapper .splash'))`,
		returnByValue: true
	})
	if (state.result.value) break
	await new Promise(resolve => setTimeout(resolve, 50))
}
const splash = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
await writeFile(join(outputDir, 'startup-animation.png'), Buffer.from(splash.data, 'base64'))

for (let attempt = 0; attempt < 120; attempt++) {
	const state = await call('Runtime.evaluate', {
		expression: `Boolean(document.querySelector('.setup-card'))`,
		returnByValue: true
	})
	if (state.result.value) break
	await new Promise(resolve => setTimeout(resolve, 250))
}

const results = []
const journeyFrames = []
for (const time of [0, 4300, 9000]) {
	const state = await call('Runtime.evaluate', {
		expression: `(() => {
			const convoy = document.querySelector('.setup-journey .journey-convoy')
			const animation = convoy?.getAnimations()[0]
			if (!animation) throw new Error('No existe la animación del camión')
			animation.pause()
			animation.currentTime = ${time}
			return { time: ${time}, name: convoy.textContent.trim(), transform: getComputedStyle(convoy).transform }
		})()`, returnByValue: true
	})
	journeyFrames.push(state.result.value)
	await new Promise(resolve => setTimeout(resolve, 50))
	const shot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
	await writeFile(join(outputDir, `journey-${time}.png`), Buffer.from(shot.data, 'base64'))
}
for (const viewport of [{ width: 600, height: 520 }, { width: 960, height: 620 }, { width: 1366, height: 768 }]) {
	await call('Emulation.setDeviceMetricsOverride', { ...viewport, deviceScaleFactor: 1, mobile: false })
	await new Promise(resolve => setTimeout(resolve, 150))
	const evaluation = await call('Runtime.evaluate', {
		expression: `(() => {
			const visible = element => {
				const style = getComputedStyle(element)
				return style.display !== 'none' && style.visibility !== 'hidden'
			}
			const interactive = [...document.querySelectorAll('button, input, select, [role="radio"]')].filter(visible)
			const outside = interactive.filter(element => {
				const box = element.getBoundingClientRect()
				return box.left < -1 || box.right > innerWidth + 1
			}).map(element => (element.textContent || element.getAttribute('aria-label') || element.tagName).trim().slice(0, 60))
			const brokenImages = [...document.images].filter(image => image.complete && image.naturalWidth === 0).map(image => image.src)
			const grid = document.querySelector('.language-grid')
			return {
				title: document.title,
				viewport: { width: innerWidth, height: innerHeight },
				bodyWidth: document.documentElement.scrollWidth,
				languageOptions: document.querySelectorAll('.language-option').length,
				setupVisible: Boolean(document.querySelector('.setup-card')),
				outside,
				brokenImages,
				languageScroll: grid ? { clientHeight: grid.clientHeight, scrollHeight: grid.scrollHeight, overflowY: getComputedStyle(grid).overflowY } : null
			}
		})()`,
		returnByValue: true
	})
	const value = evaluation.result.value
	results.push(value)
	const shot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
	await writeFile(join(outputDir, `setup-${viewport.width}x${viewport.height}.png`), Buffer.from(shot.data, 'base64'))
}

socket.close()
child.kill()

if (journeyFrames.length !== 3 || new Set(journeyFrames.map(frame => frame.transform)).size !== 3 || journeyFrames.some(frame => !frame.name.includes('SnowRunner Studio'))) throw new Error(`El camión no recorre el terreno llevando el nombre: ${JSON.stringify(journeyFrames)}`)

for (const result of results) {
	if (result.title !== 'SnowRunner Studio') throw new Error(`Título inesperado: ${result.title}`)
	if (!result.setupVisible || result.languageOptions !== 13) throw new Error(`El inicio no se cargó completo: ${JSON.stringify(result)}`)
	if (result.bodyWidth > result.viewport.width || result.outside.length) throw new Error(`Hay controles fuera de pantalla: ${JSON.stringify(result)}`)
	if (result.brokenImages.length) throw new Error(`Hay imágenes rotas: ${result.brokenImages.join(', ')}`)
}

console.log(JSON.stringify(results, null, 2))
