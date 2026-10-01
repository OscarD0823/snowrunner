import { spawn } from 'node:child_process'
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = dirname(dirname(fileURLToPath(import.meta.url)))
const exe = join(repo, 'out', 'SnowRunner Studio-win32-x64', 'SnowRunner Studio.exe')
const outputDir = join(repo, '.vite', 'library-ui-smoke')
const dataRoot = join(outputDir, 'data')
let initialPath = join(repo, '.snowrunner-data', 'backups', 'initial.pak')
let workspace = join(repo, '.snowrunner-data')
const port = 9334

try {
	const installedConfig = JSON.parse(await readFile(join(
		process.env.APPDATA,
		'SnowRunner Studio',
		'jsons',
		'config.json'
	), 'utf8'))
	const candidate = installedConfig.initialPath
	const normalized = candidate?.replaceAll('/', '\\')
	const marker = '\\preload\\paks\\client\\initial.pak'
	const markerIndex = normalized?.toLowerCase().lastIndexOf(marker) ?? -1
	if (candidate && markerIndex >= 0) {
		await stat(candidate)
		await stat(join(dirname(candidate), 'gfx.pak'))
		initialPath = candidate
		workspace = join(normalized.slice(0, markerIndex), '.snowrunner-studio')
	}
} catch {}

await rm(outputDir, { recursive: true, force: true })
await mkdir(join(dataRoot, 'jsons'), { recursive: true })
await writeFile(join(dataRoot, 'jsons', 'config.json'), JSON.stringify({
	version: JSON.parse(await readFile(join(repo, 'package.json'), 'utf8')).version,
	buildType: 'prod',
	lang: 'ES',
	initialPath,
	advancedMode: false,
	useMods: false,
	openWhatsNew: false,
	checkUpdates: false,
	optimizeUnpack: false,
	customImages: {}
}, null, 2))
await writeFile(join(dataRoot, 'jsons', 'sizes.json'), JSON.stringify({
	initial: (await stat(initialPath)).size,
	mods: {}
}, null, 2))

const child = spawn(exe, [`--remote-debugging-port=${port}`, `--user-data-dir=${dataRoot}`], {
	env: {
		...process.env,
		SNOWRUNNER_DATA_ROOT: dataRoot,
		SNOWRUNNER_WORKSPACE_PATH: workspace
	},
	stdio: 'ignore',
	windowsHide: true
})
let socket
try {

async function getTarget() {
	for (let attempt = 0; attempt < 100; attempt++) {
		try {
			const targets = await fetch(`http://127.0.0.1:${port}/json`).then(response => response.json())
			const page = targets.find(target => target.type === 'page' && target.webSocketDebuggerUrl)
			if (page) return page
		} catch {}
		await new Promise(resolve => setTimeout(resolve, 150))
	}
	throw new Error('La biblioteca no expuso la página de prueba.')
}

const target = await getTarget()
socket = new WebSocket(target.webSocketDebuggerUrl)
const waiting = new Map()
const diagnostics = []
const networkFailures = []
const networkRequests = new Map()
let sequence = 0

socket.addEventListener('message', event => {
	const message = JSON.parse(event.data)
	if (!message.id) {
		if (message.method === 'Runtime.consoleAPICalled') {
			diagnostics.push(message.params.args.map(argument => argument.value ?? argument.description).join(' '))
		} else if (message.method === 'Runtime.exceptionThrown') {
			diagnostics.push(message.params.exceptionDetails.text)
		} else if (message.method === 'Log.entryAdded') {
			diagnostics.push(message.params.entry.text)
		} else if (message.method === 'Network.requestWillBeSent') {
			networkRequests.set(message.params.requestId, message.params.request.url)
		} else if (message.method === 'Network.loadingFailed') {
			networkFailures.push({
				url: networkRequests.get(message.params.requestId),
				errorText: message.params.errorText,
				blockedReason: message.params.blockedReason
			})
		}
		return
	}
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

async function evaluate(expression) {
	return (await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value
}

await call('Page.enable')
await call('Runtime.enable')
await call('Log.enable')
await call('Network.enable')
await call('Emulation.setDeviceMetricsOverride', { width: 960, height: 620, deviceScaleFactor: 1, mobile: false })

for (let attempt = 0; attempt < 160; attempt++) {
	if (await evaluate(`document.querySelectorAll('.card-container').length > 0`)) break
	await new Promise(resolve => setTimeout(resolve, 250))
}

for (let attempt = 0; attempt < 800; attempt++) {
	if (await evaluate(`[...document.querySelectorAll('.card-container img')].some(image => image.src.includes('/game-images/'))`)) break
	await new Promise(resolve => setTimeout(resolve, 125))
}

const truckState = await evaluate(`(async () => {
	const visibleImages = [...document.querySelectorAll('.card-container img')].filter(image => {
		const box = image.getBoundingClientRect()
		return box.width > 0 && box.height > 0 && box.bottom > 0 && box.top < innerHeight
	})
	const noiseScores = visibleImages.map(image => {
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
		return Number((difference / comparisons).toFixed(2))
	})
	return {
		title: document.title,
		cards: document.querySelectorAll('.card-container').length,
		visibleImages: visibleImages.length,
		officialImages: visibleImages.filter(image => image.src.includes('/game-images/')).length,
		imageSources: visibleImages.map(image => image.src),
		noiseScores,
		brokenImages: visibleImages.filter(image => image.complete && image.naturalWidth === 0).map(image => image.src),
		bodyWidth: document.documentElement.scrollWidth,
		viewportWidth: innerWidth,
		menuLabels: [...document.querySelectorAll('.workspace-navigation__item')].map(button => button.textContent.trim())
	}
})()`)
const truckShot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
await writeFile(join(outputDir, 'trucks-960x620.png'), Buffer.from(truckShot.data, 'base64'))

const categories = {}

async function waitFor(expression, description) {
	for (let attempt = 0; attempt < 160; attempt++) {
		if (await evaluate(expression)) return
		await new Promise(resolve => setTimeout(resolve, 125))
	}
	throw new Error(`No se completó: ${description}. ${diagnostics.join('\n')}`)
}
async function selectCategory(label) {
	await evaluate(`(() => {
		const button = [...document.querySelectorAll('.workspace-navigation__item')].find(item => item.textContent.trim() === ${JSON.stringify(label)})
		if (!button) throw new Error('Falta la categoría')
		button.click()
	})()`)
}
async function back() {
	await evaluate(`document.querySelector('.ant-page-header-back-button')?.click()`)
	await waitFor(`Boolean(document.querySelector('.list')?.getBoundingClientRect().height) && !document.querySelector('.vehicle-preview, .component-editor')`, 'volver a la biblioteca')
}
const fords = []
for (const model of ['CLT9000', 'F 750']) {
	const found = await evaluate(`(() => {
		const card = [...document.querySelectorAll('.card-container')].find(item => item.textContent.replace(/[- ]/g, '').toLowerCase().includes(${JSON.stringify(model.replace(/[- ]/g, '').toLowerCase())}))
		card?.scrollIntoView({ block: 'center' })
		return Boolean(card)
	})()`)
	if (!found) throw new Error(`No apareció el Ford ${model}`)
	await waitFor(`(() => {
		const image = [...document.querySelectorAll('.card-container img')].find(image => image.alt.replace(/[- ]/g, '').toLowerCase().includes(${JSON.stringify(model.replace(/[- ]/g, '').toLowerCase())}))
		return image?.complete && image.naturalWidth > 0 && image.src.includes('/game-images/')
	})()`, `carátula Ford ${model}`)
	await evaluate(`(() => {
		const card = [...document.querySelectorAll('.card-container')].find(item => item.textContent.replace(/[- ]/g, '').toLowerCase().includes(${JSON.stringify(model.replace(/[- ]/g, '').toLowerCase())}))
		card.querySelector('.card').click()
	})()`)
	await waitFor(`Boolean(document.querySelector('.vehicle-preview strong')?.textContent.replace(/[- ]/g, '').toLowerCase().includes(${JSON.stringify(model.replace(/[- ]/g, '').toLowerCase())}) && document.querySelector('.vehicle-preview img')?.complete && document.querySelector('.vehicle-preview img')?.naturalWidth > 0 && document.querySelector('.vehicle-preview img')?.src.includes(${JSON.stringify(model === 'CLT9000' ? 'shopimgfordclt9000' : 'shopimgford750')}))`, `foto del Ford ${model} en el editor`)
	fords.push(await evaluate(`({name: document.querySelector('.vehicle-preview strong').textContent, image: document.querySelector('.vehicle-preview img').src, parameters: document.querySelectorAll('.parameter').length})`))
	const shot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
	await writeFile(join(outputDir, `ford-${model.replaceAll(' ', '')}-editor.png`), Buffer.from(shot.data, 'base64'))
	await back()
}

await selectCategory('Remolques')
await waitFor(`document.querySelectorAll('.card-container').length > 0 && [...document.querySelectorAll('.card-container img')].some(image => image.complete && image.naturalWidth > 0 && image.src.startsWith('data:'))`, 'remolques con vista representativa')
const trailers = await evaluate(`({cards: document.querySelectorAll('.card-container').length, visible: [...document.querySelectorAll('.card-container')].filter(card => getComputedStyle(card).display !== 'none').length, previews: [...document.querySelectorAll('.card-container img')].filter(image => image.src.startsWith('data:')).length})`)
await evaluate(`document.querySelector('.card-container .card').click()`)
await waitFor(`document.querySelectorAll('.parameter').length > 0 && Boolean(document.querySelector('.vehicle-preview img')?.naturalWidth)`, 'editor de remolques')
trailers.editorParameters = await evaluate(`document.querySelectorAll('.parameter').length`)
await back()

for (const label of ['Motores', 'Neumáticos', 'Cabrestantes']) {
	await evaluate(`(() => {
		const button = [...document.querySelectorAll('.workspace-navigation__item')].find(item => item.textContent.trim() === ${JSON.stringify(label)})
		button?.click()
		return Boolean(button)
	})()`)
	for (let attempt = 0; attempt < 80; attempt++) {
		if (await evaluate(`document.querySelectorAll('.component-card').length > 0`)) break
		await new Promise(resolve => setTimeout(resolve, 125))
	}
	categories[label] = await evaluate(`({
		cards: document.querySelectorAll('.component-card').length,
		illustrations: document.querySelectorAll('.component-card .component-cover > svg, .component-card .tire-preview').length,
		bodyWidth: document.documentElement.scrollWidth,
		viewportWidth: innerWidth,
		sample: (() => {
			const card = document.querySelector('.component-card')
			const cover = card?.querySelector('.component-cover')
			const svg = cover?.querySelector(':scope > svg, .tire-preview')
			return card && cover && svg ? {
				card: card.getBoundingClientRect().toJSON(),
				cover: cover.getBoundingClientRect().toJSON(),
				svg: svg.getBoundingClientRect().toJSON(),
				color: getComputedStyle(cover).color,
				display: getComputedStyle(card).display
			} : null
		})()
	})`)
	await waitFor(`document.querySelector('.component-card .component-variants')?.textContent.trim().length > 0`, `nombres de ${label}`)
	if (label === 'Neumáticos') {
		await waitFor(`Boolean(document.querySelector('.tire-preview img')?.naturalWidth > 0)`, 'render de neumáticos')
		categories[label].rendered = await evaluate(`document.querySelectorAll('.tire-preview img').length`)
		const shot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
		await writeFile(join(outputDir, 'tires-3d.png'), Buffer.from(shot.data, 'base64'))
	}
	await evaluate(`document.querySelector('.component-card').click()`)
	await waitFor(`document.querySelectorAll('.component-editor .ant-collapse-header').length > 0`, `editor de ${label}`)
	await evaluate(`document.querySelector('.component-editor .ant-collapse-header').click()`)
	await waitFor(`[...document.querySelectorAll('.component-editor .parameter-help')].some(help => help.getBoundingClientRect().height > 0) && [...document.querySelectorAll('.component-editor input')].some(input => input.getBoundingClientRect().height > 0)`, `campos visibles de ${label}`)
	await new Promise(resolve => setTimeout(resolve, 300))
	categories[label].editor = await evaluate(`({title: document.querySelector('.header-title').textContent, variants: [...document.querySelectorAll('.component-editor .ant-collapse-header')].map(item => item.textContent.trim()), labels: [...document.querySelectorAll('.component-editor .parameter .label')].map(item => item.textContent.trim()), help: document.querySelectorAll('.component-editor .parameter-help').length, preview: Boolean(document.querySelector('.component-editor .tire-preview img')?.naturalWidth)})`)
	const editorShot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
	await writeFile(join(outputDir, `${label}-editor.png`), Buffer.from(editorShot.data, 'base64'))
	await back()
}

await new Promise(resolve => setTimeout(resolve, 500))

const shot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
await writeFile(join(outputDir, 'components-960x620.png'), Buffer.from(shot.data, 'base64'))
socket.close()
child.kill()

if (truckState.title !== 'SnowRunner Studio' || truckState.cards < 100) {
	throw new Error(`La biblioteca de vehículos no se cargó: ${JSON.stringify(truckState)}`)
}
if (!truckState.visibleImages || !truckState.officialImages || truckState.brokenImages.length
	|| truckState.noiseScores.some(score => score >= 50)) {
	throw new Error(`Las carátulas visibles fallaron: ${JSON.stringify({ truckState, diagnostics, networkFailures })}`)
}
if (truckState.bodyWidth > truckState.viewportWidth) {
	throw new Error(`La biblioteca genera desplazamiento horizontal: ${JSON.stringify(truckState)}`)
}
for (const [label, state] of Object.entries(categories)) {
	if (!state.cards || state.cards !== state.illustrations || state.bodyWidth > state.viewportWidth || state.sample?.card?.height < 280) {
		throw new Error(`La categoría ${label} no se representó correctamente: ${JSON.stringify(state)}`)
	}
}

if (trailers.cards < 30 || trailers.visible !== trailers.cards || !trailers.previews || !trailers.editorParameters) throw new Error(`Falló la biblioteca de remolques: ${JSON.stringify(trailers)}`)
for (const [label, state] of Object.entries(categories)) {
	if (!state.editor.help || state.editor.variants.some(name => /UI_|undefined/.test(name))) throw new Error(`Falta traducción/ayuda en ${label}: ${JSON.stringify(state.editor)}`)
}
if (!categories['Neumáticos'].rendered || !categories['Neumáticos'].editor.preview) throw new Error('Falta el render de neumáticos')
await writeFile(join(outputDir, 'results.json'), JSON.stringify({ truckState, fords, trailers, categories, diagnostics, networkFailures }, null, 2))
console.log(JSON.stringify({ trucks: truckState.cards, fords, trailers, components: Object.fromEntries(Object.entries(categories).map(([label, state]) => [label, { cards: state.cards, rendered: state.rendered, editor: state.editor.title, help: state.editor.help }])), errors: diagnostics.filter(text => /error|failed|uncaught/i.test(text)), failedRequests: networkFailures.length }, null, 2))
} finally {
	socket?.close()
	child.kill()
}
