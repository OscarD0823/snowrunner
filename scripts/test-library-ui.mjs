import { spawn } from 'node:child_process'
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { testProjectLinks } from './project-links-ui.mjs'

const repo = dirname(dirname(fileURLToPath(import.meta.url)))
const exe = process.env.SNOWRUNNER_APP_EXE || join(repo, 'out', 'SnowRunner Studio-win32-x64', 'SnowRunner Studio.exe')
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
  const response = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description ?? response.exceptionDetails.text)
  return response.result.value
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

const projectLinks=await testProjectLinks({evaluate,call,output:outputDir,repository:'snowrunner'})
if(process.env.SNOWRUNNER_LINKS_ONLY==='1'){
  await writeFile(join(outputDir,'project-links-results.json'),JSON.stringify(projectLinks,null,2))
  console.log(JSON.stringify(projectLinks,null,2))
} else {
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
const editorLayouts = []
const allModelChecks = []
async function editorView(view) {
  if (!await evaluate(`document.querySelector('.container[data-editor-view]')?.dataset.editorView === 'split' && document.querySelector('.drive-preview')?.getBoundingClientRect().height > 0 && document.getElementById('editor-settings-panel')?.getBoundingClientRect().height > 0`)) throw new Error('El visor y los ajustes no permanecen visibles juntos')
}
async function truckGroup(icon) {
  await evaluate(`(() => {
    const header = [...document.querySelectorAll('#editor-settings-panel > .collapse > .ant-collapse-item > .ant-collapse-header')].find(header => header.querySelector('img')?.src.endsWith('/' + ${JSON.stringify(icon)} + '.webp'))
    if (!header) throw new Error('Falta grupo: ' + ${JSON.stringify(icon)})
    header.click()
  })()`)
}
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
  await editorView('settings')
  await waitFor(`document.querySelector('.drive-preview')?.dataset.modelState === 'ready'`, `visor lateral del Ford ${model}`)
  if (model === 'CLT9000') {
    await truckGroup('steering-wheel')
    await waitFor(`Boolean(document.querySelector('#editor-settings-panel input'))`, 'campos de dirección')
    await new Promise(resolve => setTimeout(resolve, 350))
    for (const width of [600, 960, 1366]) {
      await call('Emulation.setDeviceMetricsOverride', {width, height:620, deviceScaleFactor:1, mobile:false})
      await new Promise(resolve => setTimeout(resolve, 150))
      const layout = await evaluate(`(() => { const panel = document.getElementById('editor-settings-panel'); const r = panel.getBoundingClientRect(), viewer = document.querySelector('.vehicle-preview').getBoundingClientRect(); return {width:innerWidth, scroll:document.documentElement.scrollWidth, settingsHeight:r.height, panelWidth:panel.clientWidth, panelScroll:panel.scrollWidth, viewerWidth:viewer.width, beside:viewer.right <= r.left, framed:document.querySelector('.drive-preview__scene').dataset.framed, outsideInputs:[...panel.querySelectorAll('input')].filter(input=>{const box=input.getBoundingClientRect();return box.height && (box.left<r.left || box.right>r.right)}).length, visibleInputs:[...panel.querySelectorAll('input')].filter(input=>{const box=input.getBoundingClientRect();return box.height && box.top>=0 && box.bottom<=innerHeight}).length} })()`)
      if (layout.scroll > layout.width || layout.panelScroll > layout.panelWidth + 1 || layout.outsideInputs || layout.settingsHeight < 620 * .60 || !layout.visibleInputs || !layout.beside || layout.framed !== 'true') throw new Error('Visor lateral o ajustes mal encuadrados: ' + JSON.stringify(layout))
      editorLayouts.push(layout)
      const screenshot = await call('Page.captureScreenshot', {format:'png', captureBeyondViewport:false})
      await writeFile(join(outputDir, `settings-${width}.png`), Buffer.from(screenshot.data, 'base64'))
    }
    await call('Emulation.setDeviceMetricsOverride', {width:960, height:620, deviceScaleFactor:1, mobile:false})
    const edit = await evaluate(`(() => {
      const parameter = [...document.querySelectorAll('#editor-settings-panel .parameter')].find(item=>item.querySelector('input') && item.querySelectorAll('.recommendations button').length && item.getBoundingClientRect().height)
      if (!parameter) throw new Error('Falta campo editable para comprobar conservación')
      window.__layoutField = parameter.querySelector('input')
      const before = window.__layoutField.value
      parameter.querySelectorAll('.recommendations button')[1].click()
      return before
    })()`)
    await waitFor(`window.__layoutField.value !== ${JSON.stringify(edit)}`, 'cambio en memoria sin guardar')
  }
  await editorView('preview')
  await waitFor(`document.querySelector('.drive-preview')?.dataset.modelState === 'ready'`, `modelo 3D del Ford ${model}`)
  if (await evaluate(`document.querySelectorAll('.drive-preview__selectors select').length`)) throw new Error('Se muestran componentes fuera de su categoría')
  await evaluate(`document.querySelector('.drive-preview').scrollIntoView({block:'center'})`)
  await new Promise(resolve => setTimeout(resolve, 600))
  const preview = await evaluate(`({state: document.querySelector('.drive-preview').dataset.modelState, wheels: document.querySelector('.drive-preview__scene').dataset.wheels, frame: document.querySelector('.drive-preview__scene').dataset.frame, tires: document.querySelectorAll('.drive-preview__selectors select:first-child option').length, width: document.documentElement.scrollWidth, viewport: innerWidth})`)
  const originalShot = await call('Page.captureScreenshot', { format:'png', captureBeyondViewport:false })
  await writeFile(join(outputDir, `model-${model.replaceAll(' ', '')}.png`), Buffer.from(originalShot.data, 'base64'))
  if (Number(preview.wheels) !== (model === 'CLT9000' ? 6 : 4) || preview.width > preview.viewport) throw new Error('Incorrect 3D wheel placement or layout: ' + JSON.stringify(preview))
  if (model === 'CLT9000') {
    await evaluate(`window.__layoutCanvas = document.querySelector('.drive-preview__scene canvas')`)
    const retainedValue = await evaluate(`window.__layoutField.value`)
    await editorView('settings')
    if (!await evaluate(`window.__layoutField.isConnected && window.__layoutField.value === ${JSON.stringify(retainedValue)} && window.__layoutField.getBoundingClientRect().height > 0`)) throw new Error('Se perdieron los cambios al cambiar de pestaña')
    await evaluate(`[...document.querySelectorAll('.editor-section-select .ant-segmented-item')].find(item=>item.textContent.trim()==='Componentes').click()`)
    await truckGroup('wheels')
    await editorView('preview')
    await waitFor(`document.querySelector('[data-preview-kind="wheels"] select')`, 'selector exclusivo de neumáticos')
    await editorView('settings')
    await truckGroup('wheels')
    await editorView('preview')
    if (await evaluate(`document.querySelectorAll('.drive-preview__selectors select').length`)) throw new Error('Cerrar el grupo no oculta su selector')
    await editorView('settings')
    await truckGroup('wheels')
    await editorView('preview')
    await waitFor(`document.querySelector('[data-preview-kind="wheels"] select')`, 'volver a seleccionar neumáticos')
    if (await evaluate(`document.querySelectorAll('.drive-preview__selectors select').length !== 1 || Boolean(document.querySelector('[data-preview-kind="suspensions"]'))`)) throw new Error('El visor mezcla neumáticos y suspensión')
    await evaluate(`(() => {const s=document.querySelector('.drive-preview__selectors select');s.selectedIndex=3;s.dispatchEvent(new Event('change',{bubbles:true}))})()`)
    await waitFor(`document.querySelector('.drive-preview__scene').dataset.tire?.includes('allterrain')`, 'neumático cambiado en el modelo')
    await editorView('settings')
    await truckGroup('suspensions')
    await editorView('preview')
    await waitFor(`document.querySelector('[data-preview-kind="suspensions"] select')`, 'selector exclusivo de suspensión')
    if (await evaluate(`document.querySelectorAll('.drive-preview__selectors select').length !== 1 || Boolean(document.querySelector('[data-preview-kind="wheels"]'))`)) throw new Error('El visor mezcla suspensión y neumáticos')
    await evaluate(`(() => {const s=document.querySelector('.drive-preview__selectors select');s.selectedIndex=1;s.dispatchEvent(new Event('change',{bubbles:true}))})()`)
    await waitFor(`Number(document.querySelector('.drive-preview__scene').dataset.lift)>0`, 'suspensión elevada visible')
    await editorView('settings')
    await truckGroup('engines')
    await editorView('preview')
    if (await evaluate(`document.querySelectorAll('.drive-preview__selectors select').length`)) throw new Error('El motor muestra selectores de neumáticos o suspensión')
    if (!await evaluate(`document.querySelector('.drive-preview__scene').dataset.tire.includes('allterrain') && Number(document.querySelector('.drive-preview__scene').dataset.lift)>0`)) throw new Error('Se perdió la apariencia seleccionada')
    if (!await evaluate(`window.__layoutCanvas === document.querySelector('.drive-preview__scene canvas')`)) throw new Error('El visor se reinicia al cambiar de pestaña')
  }
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

if (process.env.SNOWRUNNER_ALL_MODELS === '1') {
  await mkdir(join(outputDir, 'all-models'), { recursive: true })
  for (const category of ['Camiones', 'Remolques']) {
    await selectCategory(category)
    await waitFor(`document.querySelectorAll('.card-container').length === ${category === 'Camiones' ? truckState.cards : trailers.cards}`, category)
    const names = await evaluate(`[...document.querySelectorAll('.card-container img')].map(img=>img.alt)`)
    for (const name of names) {
      await evaluate(`(() => {const image=[...document.querySelectorAll('.card-container img')].find(img=>img.alt===${JSON.stringify(name)});image.closest('.card-container').querySelector('.card').click()})()`)
      for (let attempt=0; attempt<480; attempt++) {
        if (await evaluate(`['ready','unavailable'].includes(document.querySelector('.drive-preview')?.dataset.modelState)`)) break
        await new Promise(resolve=>setTimeout(resolve,125))
      }
      const result = await evaluate(`(() => {const viewer=document.querySelector('.drive-preview'),scene=viewer?.querySelector('.drive-preview__scene'),image=document.querySelector('.vehicle-preview img'); return {state:viewer?.dataset.modelState,framed:scene?.dataset.framed,wheels:Number(scene?.dataset.wheels ?? 0),wheelGeometry:scene?.dataset.wheelGeometry === 'true',expectedWheels:Number(scene?.dataset.expectedWheels ?? 0),materials:JSON.parse(scene?.dataset.materials ?? '{}'),addons:JSON.parse(scene?.dataset.addons ?? '{}'),imageLoaded:Boolean(image?.naturalWidth),overflow:document.documentElement.scrollWidth>innerWidth}})()`)
      allModelChecks.push({ category, name, ...result })
      if (result.state !== 'ready' || result.framed !== 'true' || result.overflow || !result.imageLoaded || result.wheels !== result.expectedWheels || result.materials.loaded !== result.materials.expected) throw new Error('Falló modelo: '+JSON.stringify(allModelChecks.at(-1))+'\n'+diagnostics.slice(-10).join('\n'))
      if (result.addons.unavailable?.length) throw new Error('Faltan accesorios originales: '+JSON.stringify(allModelChecks.at(-1)))
      if (result.expectedWheels && !result.wheelGeometry) throw new Error('Ruedas sin geometría visible: '+name)
      const bounds = await evaluate(`document.querySelector('.drive-preview__scene').getBoundingClientRect().toJSON()`)
      const shot = await call('Page.captureScreenshot', {format:'png',captureBeyondViewport:false,clip:{x:bounds.x,y:bounds.y,width:bounds.width,height:bounds.height,scale:1}})
      await writeFile(join(outputDir,'all-models',`${String(allModelChecks.length).padStart(3,'0')}.png`),Buffer.from(shot.data,'base64'))
      if (allModelChecks.length % 5 === 0) console.log(`Visores reales comprobados: ${allModelChecks.length} · ${name}`)
      await back()
    }
  }
  if (allModelChecks.length !== truckState.cards + trailers.cards) throw new Error('Cobertura incompleta de modelos')
}

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
  await call('Emulation.setDeviceMetricsOverride', {width:600, height:620, deviceScaleFactor:1, mobile:false})
  await new Promise(resolve => setTimeout(resolve, 350))
  const componentLayout = await evaluate(`(() => {const body=document.querySelector('.component-editor__body');return {width:body.clientWidth,scroll:body.scrollWidth}})()`)
  if (componentLayout.scroll > componentLayout.width + 1) throw new Error('Desplazamiento lateral en ' + label + ': ' + JSON.stringify(componentLayout))
  categories[label].editor.narrowLayout = componentLayout
  await call('Emulation.setDeviceMetricsOverride', {width:960, height:620, deviceScaleFactor:1, mobile:false})
	const editorShot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
	await writeFile(join(outputDir, `${label}-editor.png`), Buffer.from(editorShot.data, 'base64'))
	await back()
}

await new Promise(resolve => setTimeout(resolve, 500))

const shot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
await writeFile(join(outputDir, 'components-960x620.png'), Buffer.from(shot.data, 'base64'))
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
const renderErrors = diagnostics.filter(text => /shader error|error|failed|uncaught|unable to serialize/i.test(text))
if (renderErrors.length || networkFailures.length) throw new Error('Errores de render o recursos: '+JSON.stringify({renderErrors,networkFailures}))
await writeFile(join(outputDir, 'results.json'), JSON.stringify({ truckState, fords, editorLayouts, trailers, categories, allModelChecks, diagnostics, networkFailures }, null, 2))
if (allModelChecks.length) {
  for (let start=0; start<allModelChecks.length; start+=24) {
    const items = allModelChecks.slice(start,start+24).map((item,i)=>({name:item.name,url:pathToFileURL(join(outputDir,'all-models',`${String(start+i+1).padStart(3,'0')}.png`)).href}))
    await call('Emulation.setDeviceMetricsOverride', {width:1600,height:1800,deviceScaleFactor:1,mobile:false})
    await evaluate(`(async()=>{document.getElementById('qa-contact')?.remove(); const wall=document.createElement('div');wall.id='qa-contact';wall.style='position:fixed;inset:0;z-index:999999;background:#fff;display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:290px;gap:8px;padding:12px;color:#162439;font:16px sans-serif;';document.body.append(wall);for(const item of ${JSON.stringify(items)}){const card=document.createElement('div'),label=document.createElement('div'),img=new Image();label.textContent=item.name;img.style='width:100%;height:250px;object-fit:contain';img.src=item.url;card.append(img,label);wall.append(card);await img.decode()}})()`)
    const sheet=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false})
    await writeFile(join(outputDir,`contact-${start/24+1}.png`),Buffer.from(sheet.data,'base64'))
  }
}
console.log(JSON.stringify({ trucks: truckState.cards, fords, editorLayouts, trailers, components: Object.fromEntries(Object.entries(categories).map(([label, state]) => [label, { cards: state.cards, rendered: state.rendered, editor: state.editor.title, help: state.editor.help }])), errors: diagnostics.filter(text => /error|failed|uncaught/i.test(text)), failedRequests: networkFailures.length }, null, 2))
}
} finally {
	socket?.close()
	child.kill()
}
