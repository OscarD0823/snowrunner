import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { fitVehicleCamera, sceneryOccludesVehicle, vehicleScreenRegion, visibleVehicleBounds } from './vehicle-framing'

export type Terrain = 'auto' | 'forest' | 'mud' | 'snow' | 'rock' | 'construction' | 'asphalt'
const palettes = {
  forest: [0x98b0b1, 0x56664b, 0x304839], mud: [0x859995, 0x554032, 0x354439],
  snow: [0xaec9d5, 0xdbe4e4, 0x56747c], rock: [0x9fa9a7, 0x747571, 0x48534a],
  construction: [0xb4b7af, 0x9b8260, 0x655e49], asphalt: [0xa8bfc3, 0x474a49, 0x516447]
} as const

/** Visual driving scene, not a simulation of the game's physics or performance. */
export class DrivingStage {
  readonly scene = new THREE.Scene()
  readonly renderer: THREE.WebGLRenderer
  readonly camera = new THREE.PerspectiveCamera(36, 1, .05, 250)
  readonly controls: OrbitControls
  readonly vehicle = new THREE.Group()
  readonly body = new THREE.Group()
  readonly wheels = new THREE.Group()
  terrain: Terrain = 'auto'
  moving = !matchMedia('(prefers-reduced-motion: reduce)').matches
  private readonly observer: ResizeObserver
  private readonly landscape = new THREE.Group()
  private readonly groundMaterial = new THREE.MeshStandardMaterial({ roughness: .96 })
  private readonly foliage = new THREE.MeshStandardMaterial({ roughness: 1 })
  private readonly roadMarks = new THREE.Group()
  private frame = 0
  private last = 0
  private time = 0
  private disposed = false
  private inView = true
  private readonly visibility: IntersectionObserver
  private radius = .6
  private groundOffset = 0
  private environment: THREE.WebGLRenderTarget
  private lift = 0
  private wheelScale = 1
  private wheelUnits: Array<{ group: THREE.Group; base: THREE.Vector3; orientation: THREE.Quaternion }> = []
  private readonly wheelAxis = new THREE.Vector3(0, 0, 1)
  private readonly wheelRotation = new THREE.Quaternion()
  private readonly scenery = new Map<THREE.Object3D, THREE.Sphere>()
  private readonly framingBox = new THREE.Box3()

  constructor(private readonly host: HTMLElement, private readonly roadcraft = false) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = .95
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    host.append(this.renderer.domElement)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true; this.controls.enablePan = false
    this.controls.minDistance = 2; this.controls.maxDistance = 180; this.controls.maxPolarAngle = Math.PI * .48
    const generator = new THREE.PMREMGenerator(this.renderer), room = new RoomEnvironment()
    this.environment = generator.fromScene(room, .04)
    this.scene.environment = this.environment.texture; this.scene.environmentIntensity = .55
    room.dispose(); generator.dispose()
    this.scene.add(this.vehicle, new THREE.HemisphereLight(0xe6efff, 0x685747, 1.1))
    this.vehicle.add(this.body, this.wheels)
    const sunlight = new THREE.DirectionalLight(0xffead3, 2.2)
    sunlight.position.set(10, 16, 8); sunlight.castShadow = true
    sunlight.shadow.mapSize.set(1024, 1024)
    Object.assign(sunlight.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, far: 70 })
    sunlight.shadow.bias = -.0004
    this.scene.add(sunlight)
    const fill = new THREE.DirectionalLight(0xcbdde5, .65); fill.position.set(-8, 4, -9); this.scene.add(fill)
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), this.groundMaterial)
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; this.scene.add(ground, this.landscape, this.roadMarks)
    // Fixed seed keeps screenshots and transitions reproducible.
    for (let i = 0; i < 48; i++) {
      const x = i * 1.713 % 80 - 40, side = i % 2 ? -1 : 1, z = side * (6 + i * 2.13 % 16)
      const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(.15 + i * .17 % .5, 0), new THREE.MeshStandardMaterial({ color: 0x787a71, roughness: 1 }))
      rock.position.set(x, .14, z * .75); rock.rotation.set(i, i * .3, i * .7); rock.castShadow = true; this.landscape.add(rock)
      const tree = new THREE.Group()
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.08, .14, 2.4, 5), new THREE.MeshStandardMaterial({ color: 0x685c4e }))
      trunk.position.y = 1.2; tree.add(trunk)
      const branches = new THREE.Mesh(new THREE.ConeGeometry(1.05, 3.8, 7), this.foliage)
      branches.position.y = 3.2; branches.castShadow = true; tree.add(branches)
      tree.position.set(x + 2, 0, z); tree.scale.setScalar(.65 + i * .11 % .7); this.landscape.add(tree)
      if (i < 20) {
        const track = new THREE.Mesh(new THREE.BoxGeometry(.85, .014, .06), new THREE.MeshStandardMaterial({ color: 0xa89a7d, roughness: 1 }))
        track.position.set(i * 3 - 30, .008, i % 2 ? -1 : 1); this.roadMarks.add(track)
      }
    }
    for (let i = 0; i < 12; i++) {
      const mountain = new THREE.Mesh(new THREE.ConeGeometry(7 + i % 4, 9 + i % 3 * 2, 5), new THREE.MeshStandardMaterial({ color: 0x677b7b, roughness: 1 }))
      mountain.position.set(i * 13 - 65, 3.4, (i % 2 ? -1 : 1) * 42)
      this.scene.add(mountain)
      this.scenery.set(mountain, new THREE.Box3().setFromObject(mountain).getBoundingSphere(new THREE.Sphere()))
    }
    for (const object of this.landscape.children) this.scenery.set(object, new THREE.Box3().setFromObject(object).getBoundingSphere(new THREE.Sphere()))
    this.scene.fog = new THREE.Fog(0xaec9d5, 25, 85)
    this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(host)
    this.visibility = new IntersectionObserver(entries => { this.inView = entries[0].isIntersecting }, { threshold: .01 }); this.visibility.observe(host)
    this.resize(); this.animate(0)
  }
  private resize() {
    const { width, height } = this.host.getBoundingClientRect()
    if (!width || !height) return
    this.renderer.setSize(width, height, false); this.camera.aspect = width / height; this.camera.updateProjectionMatrix()
    this.fitCamera(false)
  }
  setBody(model: THREE.Object3D) {
    this.body.clear(); this.body.add(model)
    this.body.position.y = 0
    this.resetCamera()
  }
  setWheels(units: Array<{ model: THREE.Object3D; position: [number, number, number]; scale: number; right: boolean; radius?: number; orientation?: THREE.Quaternion }>) {
    this.wheels.clear(); this.wheelUnits = []
    let visibleWheels = true
    for (const unit of units) {
      const group = new THREE.Group()
      unit.model.scale.multiplyScalar(unit.scale)
      if (unit.right) unit.model.rotation.y = Math.PI
      visibleWheels &&= !visibleVehicleBounds(unit.model).isEmpty()
      if (unit.orientation) group.quaternion.copy(unit.orientation)
      group.add(unit.model); group.position.fromArray(unit.position); this.wheels.add(group)
      this.wheelUnits.push({ group, base: group.position.clone(), orientation: group.quaternion.clone() })
      this.radius = Math.max(.15, unit.radius ?? unit.scale)
    }
    this.host.dataset.wheels = String(units.length)
    this.host.dataset.wheelGeometry = String(visibleWheels)
    this.setAppearance(this.lift, this.wheelScale, true)
  }
  setAppearance(lift: number, scale = 1, force = false) {
    const changed = force || lift !== this.lift || scale !== this.wheelScale
    if (!changed) return
    this.lift = Math.min(Math.max(lift, -.5), 3); this.wheelScale = Math.min(Math.max(scale, .3), 4)
    for (const unit of this.wheelUnits) {
      unit.group.scale.setScalar(this.wheelScale)
      unit.group.position.y = unit.base.y + this.radius * (this.wheelScale - 1)
    }
    this.body.position.y = this.lift + this.radius * (this.wheelScale - 1)
    this.host.dataset.lift = String(this.lift)
    this.vehicle.position.y = 0; this.vehicle.rotation.z = 0
    const bounds = visibleVehicleBounds(this.vehicle)
    this.groundOffset = bounds.isEmpty() ? 0 : Math.max(0, -bounds.min.y) + .025
    if (changed) this.fitCamera(false)
  }
  resetCamera() { this.fitCamera(true) }
  private fitCamera(reset: boolean) {
    if (!this.body.children.length) return
    this.vehicle.position.y = this.groundOffset; this.vehicle.rotation.z = 0
    const direction = reset ? undefined : this.camera.position.clone().sub(this.controls.target)
    const box = visibleVehicleBounds(this.vehicle)
    this.framingBox.copy(box).expandByScalar(.1)
    this.controls.target.copy(fitVehicleCamera(this.camera, box, direction?.lengthSq() ? direction : undefined))
    const distance = this.camera.position.distanceTo(this.controls.target)
    const fog = this.scene.fog as THREE.Fog
    fog.near = Math.max(25,distance+box.getSize(new THREE.Vector3()).length()); fog.far=fog.near+70
    this.controls.update()
    this.host.dataset.bounds = JSON.stringify({ min: box.min.toArray(), max: box.max.toArray() })
    const corners: THREE.Vector3[] = []
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) corners.push(new THREE.Vector3(x,y,z).project(this.camera))
    this.host.dataset.framed = String(corners.every(p => Math.abs(p.x) < 1 && Math.abs(p.y) < 1 && Math.abs(p.z) < 1))
  }
  private animate = (now: number) => {
    if (this.disposed) return
    this.frame = requestAnimationFrame(this.animate)
    const dt = Math.min((now - this.last) / 1000, .05); this.last = now
    if (document.hidden || !this.inView) return
    if (this.moving) this.time += dt
    const sequence: Array<keyof typeof palettes> = this.roadcraft ? ['construction', 'asphalt', 'mud', 'forest', 'rock'] : ['forest', 'mud', 'rock', 'snow']
    const index = Math.floor(this.time / 24) % sequence.length
    const transition = Math.min((this.time % 24) / 5, 1)
    const current = palettes[this.terrain === 'auto' ? sequence[index] : this.terrain]
    const prior = palettes[this.terrain === 'auto' ? sequence[(index + sequence.length - 1) % sequence.length] : this.terrain]
    const sky = new THREE.Color(prior[0]).lerp(new THREE.Color(current[0]), transition)
    this.scene.background = sky; (this.scene.fog as THREE.Fog).color.copy(sky)
    this.groundMaterial.color.set(prior[1]).lerp(new THREE.Color(current[1]), transition)
    this.foliage.color.set(prior[2]).lerp(new THREE.Color(current[2]), transition)
    const move = this.time * 2.5
    this.landscape.position.x = -(move % 16)
    this.roadMarks.position.x = -(move % 3)
    this.vehicle.position.y = this.groundOffset + (this.moving ? .02 * Math.sin(this.time * 5) : 0)
    this.vehicle.rotation.z = this.moving ? .004 * Math.sin(this.time * 3) : 0
    this.wheelRotation.setFromAxisAngle(this.wheelAxis, -move / this.radius)
    for (const unit of this.wheelUnits) unit.group.quaternion.copy(unit.orientation).multiply(this.wheelRotation)
    this.controls.update(); this.camera.updateMatrixWorld()
    if (!this.framingBox.isEmpty()) {
      const region = vehicleScreenRegion(this.camera, this.framingBox)
      for (const [object, original] of this.scenery) {
        const sphere = original.clone()
        if (object.parent === this.landscape) sphere.center.add(this.landscape.position)
        object.visible = !sceneryOccludesVehicle(this.camera, region, sphere)
      }
    }
    this.renderer.render(this.scene, this.camera)
    this.host.dataset.terrain = this.terrain === 'auto' ? sequence[index] : this.terrain
    this.host.dataset.frame = String(Math.floor(this.time * 10))
  }
  dispose() {
    this.disposed = true; cancelAnimationFrame(this.frame)
    this.observer.disconnect(); this.visibility.disconnect(); this.controls.dispose()
    const materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>(), geometries = new Set<THREE.BufferGeometry>()
    this.scene.traverse(o => {
      if (!(o instanceof THREE.Mesh)) return
      geometries.add(o.geometry)
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) { materials.add(m); for (const value of Object.values(m)) if (value instanceof THREE.Texture) textures.add(value) }
    })
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose())
    this.environment.dispose()
    this.renderer.dispose(); this.renderer.forceContextLoss(); this.renderer.domElement.remove()
  }
}
