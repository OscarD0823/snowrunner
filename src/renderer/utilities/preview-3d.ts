import * as THREE from 'three'

// Un solo contexto WebGL para todo el catálogo, sin bucles de animación ni
// modelos del juego. Las miniaturas son renders originales representativos.
let renderer: THREE.WebGLRenderer | undefined
let unavailable = false
const cache = new Map<string, string>()

export type TirePreviewOptions = { radius?: number; width?: number; pattern?: string }

function getRenderer() {
	if (unavailable) return
	try {
		renderer ??= new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true })
		renderer.setSize(440, 320, false)
		renderer.setPixelRatio(1)
		renderer.outputColorSpace = THREE.SRGBColorSpace
		renderer.toneMapping = THREE.ACESFilmicToneMapping
		return renderer
	} catch {
		unavailable = true
		return
	}
}

function renderModel(key: string, model: THREE.Group, position: THREE.Vector3, target: THREE.Vector3) {
	const engine = getRenderer()
	if (!engine) { dispose(model); return }
	const scene = new THREE.Scene()
	scene.add(model, new THREE.HemisphereLight(0xcfeaff, 0x394045, 2.6))
	const keyLight = new THREE.DirectionalLight(0xffffff, 4)
	keyLight.position.set(3, 6, 5)
	const rimLight = new THREE.DirectionalLight(0xffb970, 2.8)
	rimLight.position.set(-3, 2, -4)
	scene.add(keyLight, rimLight)
	const camera = new THREE.PerspectiveCamera(32, 440 / 320, 0.01, 100)
	camera.position.copy(position)
	camera.lookAt(target)
	try {
		engine.render(scene, camera)
		const src = engine.domElement.toDataURL('image/png')
		cache.set(key, src)
		return src
	} catch { return undefined }
	finally { dispose(model) }
}

function dispose(model: THREE.Group) {
	model.traverse(object => {
		if (!(object instanceof THREE.Mesh)) return
		object.geometry.dispose()
		for (const material of Array.isArray(object.material) ? object.material : [object.material]) material.dispose()
	})
}

export function renderTire(options: TirePreviewOptions = {}) {
	const ratio = THREE.MathUtils.clamp((options.width ?? 0.62) / (options.radius ?? 1), 0.24, 1.2)
	const pattern = options.pattern ?? 'offroad'
	const type = /chain/.test(pattern) ? 'chain' : /mud/.test(pattern) ? 'mud' : /highway/.test(pattern) ? 'road' : 'offroad'
	const key = `tire:${ratio.toFixed(3)}:${type}`
	if (cache.has(key)) return cache.get(key)
	const model = new THREE.Group()
	const wheel = new THREE.Group()
	const half = ratio / 2
	const profile = [
		[0.49, -half], [0.75, -half * 1.08], [0.95, -half * 0.9], [1, -half * 0.55],
		[1, half * 0.55], [0.95, half * 0.9], [0.75, half * 1.08], [0.49, half], [0.49, -half]
	].map(([r, y]) => new THREE.Vector2(r, y))
	wheel.add(new THREE.Mesh(new THREE.LatheGeometry(profile, 64), new THREE.MeshStandardMaterial({ color: 0x262b31, roughness: 0.87 })))
	const rows = type === 'road' ? 5 : 3
	const segments = type === 'mud' ? 26 : 40
	const treads = new THREE.InstancedMesh(
		new THREE.BoxGeometry(type === 'road' ? 0.075 : 0.14, ratio / rows * 0.8, type === 'mud' ? 0.13 : 0.07),
		new THREE.MeshStandardMaterial({ color: 0x343a42, roughness: 0.95 }), rows * segments
	)
	const dummy = new THREE.Object3D()
	for (let row = 0; row < rows; row++) {
		for (let i = 0; i < segments; i++) {
			const angle = i / segments * Math.PI * 2 + (row % 2 ? Math.PI / segments : 0)
			dummy.position.set(Math.sin(angle), -half * 0.7 + row * ratio * 0.7 / Math.max(1, rows - 1), Math.cos(angle))
			dummy.rotation.set(0, angle, type === 'road' ? 0 : (row % 2 ? 0.22 : -0.22))
			dummy.updateMatrix()
			treads.setMatrixAt(row * segments + i, dummy.matrix)
		}
	}
	wheel.add(treads)
	const metal = new THREE.MeshStandardMaterial({ color: 0xa2acb8, metalness: 0.8, roughness: 0.35 })
	wheel.add(new THREE.Mesh(new THREE.CylinderGeometry(0.495, 0.495, ratio * 0.92, 48), metal))
	for (const side of [-1, 1]) {
		const rim = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.035, 12, 48), metal.clone())
		rim.rotation.x = Math.PI / 2
		rim.position.y = side * half
		wheel.add(rim)
		const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.075, 32), new THREE.MeshStandardMaterial({ color: 0x4b596c, metalness: 0.65, roughness: 0.4 }))
		hub.position.y = side * half
		wheel.add(hub)
		for (let i = 0; i < 8; i++) {
			const angle = i * Math.PI / 4
			const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.012, 12), new THREE.MeshStandardMaterial({ color: 0x111923 }))
			hole.position.set(Math.sin(angle) * 0.29, side * half * 0.96, Math.cos(angle) * 0.29)
			wheel.add(hole)
		}
	}
	if (type === 'chain') {
		for (let i = 0; i < 14; i++) {
			const chain = new THREE.Mesh(new THREE.TorusGeometry(1.045, 0.018, 6, 64, ratio + 0.3), new THREE.MeshStandardMaterial({ color: 0xced5df, metalness: 0.85, roughness: 0.4 }))
			chain.rotation.y = i * Math.PI / 7
			chain.rotation.z = Math.PI / 2
			wheel.add(chain)
		}
	}
	wheel.rotation.z = Math.PI / 2
	wheel.position.y = 1.05
	model.add(wheel)
	return renderModel(key, model, new THREE.Vector3(3.5, 2.35, 3.9), new THREE.Vector3(0, 1.05, 0))
}

/** Siluetas por familia: nunca se presentan como fotografías del remolque. */
export function renderTrailer(name: string) {
	const type = /oil|water|tank|fuel/.test(name) ? 'tank' : /log/.test(name) ? 'log'
		: /repair|service|curtain|cabin/.test(name) ? 'box' : /sideboard/.test(name) ? 'sideboard' : 'flatbed'
	const semi = /semi/.test(name)
	const scout = /scout/.test(name)
	const key = `trailer:${type}:${semi}:${scout}`
	if (cache.has(key)) return cache.get(key)
	const model = new THREE.Group()
	const steel = new THREE.MeshStandardMaterial({ color: 0x5e827c, metalness: 0.5, roughness: 0.5 })
	const dark = new THREE.MeshStandardMaterial({ color: 0x273440, roughness: 0.8 })
	const length = scout ? 3 : semi ? 7 : 5
	function box(x: number, y: number, z: number, px: number, py: number, pz: number, material = steel) {
		const mesh = new THREE.Mesh(new THREE.BoxGeometry(x, y, z), material.clone())
		mesh.position.set(px, py, pz)
		model.add(mesh)
	}
	box(length, 0.22, 1.9, 0, 1.0, 0)
	box(length, 0.2, 0.3, 0, 0.78, 0, dark)
	if (!semi) box(1.4, 0.15, 0.18, length / 2 + 0.55, 0.7, 0, dark)
	if (type === 'tank') {
		const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.83, 0.83, length * 0.88, 48), new THREE.MeshStandardMaterial({ color: 0xd1d7de, metalness: 0.65, roughness: 0.3 }))
		tank.rotation.z = Math.PI / 2
		tank.position.y = 1.9
		model.add(tank)
	} else if (type === 'box') box(length * 0.92, 1.7, 1.86, 0, 1.96, 0)
	else if (type === 'sideboard') for (const z of [-0.91, 0.91]) box(length, 0.75, 0.07, 0, 1.48, z)
	else if (type === 'log') {
		for (const x of [-length * 0.38, length * 0.38]) for (const z of [-0.87, 0.87]) box(0.12, 1.2, 0.12, x, 1.6, z)
	}
	const axles = scout ? [0] : semi ? [-length * 0.3, -length * 0.12] : [-length * 0.32, length * 0.32]
	for (const x of axles) for (const z of [-0.97, 0.97]) {
		const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.3, 32), dark.clone())
		tire.rotation.x = Math.PI / 2
		tire.position.set(x, 0.5, z)
		model.add(tire)
		const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.32, 24), new THREE.MeshStandardMaterial({ color: 0xa8b5c4, metalness: 0.7, roughness: 0.4 }))
		hub.rotation.x = Math.PI / 2
		hub.position.copy(tire.position)
		model.add(hub)
	}
	const distance = length * 1.3 + 4
	return renderModel(key, model, new THREE.Vector3(distance * 0.6, distance * 0.48, distance * 0.85), new THREE.Vector3(0, 1, 0))
}
