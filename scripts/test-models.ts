import assert from 'node:assert/strict'
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import * as THREE from 'three'
import { join } from 'node:path'
import { readGameEntry } from '../src/modules/images/game-archive'
import { parseCombineMesh, disposeGameModel } from '../src/renderer/utilities/combine-mesh'
import { fitVehicleCamera, sceneryOccludesVehicle, vehicleScreenRegion } from '../src/renderer/utilities/vehicle-framing'
import { addonPlacement } from '../src/renderer/utilities/addon-placement'
import { wheelPlacement } from '../src/renderer/utilities/wheel-placement'
import { readGamePaint, parseGamePaints } from '../src/modules/images/game-paint'
import { selectWheelVariant } from '../src/renderer/utilities/wheel-variant'
import { visibleVehicleBounds } from '../src/renderer/utilities/vehicle-framing'

const game = process.env.SNOWRUNNER_GAME_ROOT ?? 'E:/SteamLibrary/steamapps/common/SnowRunner'
const root = join(game, '.snowrunner-studio/mainTemp/[media]')
const references = new Set<string>(), failures: Array<{ ref: string; error: string }> = []
const defaultAddons = new Set<string>(), addonsByName = new Map<string,string>()
assert.deepEqual(addonPlacement('(0; 0; 0)', '(0; 0; 0)').toArray(), [0,0,0])
assert.deepEqual(addonPlacement('(-2; 1.3; 0)', '(-1; .3; 0)').toArray(), [-1,1,0])
assert.deepEqual(addonPlacement(undefined, undefined).toArray(), [0,0,0])
assert.throws(()=>addonPlacement('(NaN; 1; 0)'))
assert.deepEqual(wheelPlacement([1,2,3],true).position, [1,2,-3])
const folded = new THREE.Matrix4().makeRotationX(-Math.PI/2).setPosition(.6,1.2,1)
const foldedWheel = wheelPlacement([2,-.8,1.7],false,folded.toArray())
assert.ok(new THREE.Vector3(...foldedWheel.position).distanceTo(new THREE.Vector3(2.6,2.9,1.8))<.00001)
assert.ok(foldedWheel.orientation)
assert.deepEqual(parseGamePaints('<TruckSet><Truck Name="sample"><CustomizationPreset Id="0" MaterialOverrideName="skin_00" TintColor1="g(10;20;30)" TintColor2="g(40;50;60)" TintColor3="g(70;80;90)" /></Truck></TruckSet>').get('sample'),{override:'skin_00',colors:[[10,20,30],[40,50,60],[70,80,90]]})
assert.equal(parseGamePaints('<TruckSet><Truck Name="bad"><CustomizationPreset Id="0" MaterialOverrideName="skin_00" TintColor1="g(300;20;30)" /></Truck></TruckSet>').size,0)
assert.ok(await readGamePaint(join(game,'preload/paks/client/initial.pak'),'krs_58_bandit'))
const sceneryCamera = new THREE.PerspectiveCamera(36, 1, .05, 250)
sceneryCamera.position.set(0, 2, 20); sceneryCamera.lookAt(0, 2, 0); sceneryCamera.updateMatrixWorld()
const screen = vehicleScreenRegion(sceneryCamera, new THREE.Box3(new THREE.Vector3(-8,0,-2),new THREE.Vector3(8,4,2)))
assert.equal(sceneryOccludesVehicle(sceneryCamera,screen,new THREE.Sphere(new THREE.Vector3(0,2,8),3)),true)
assert.equal(sceneryOccludesVehicle(sceneryCamera,screen,new THREE.Sphere(new THREE.Vector3(0,2,-12),3)),false)
assert.equal(sceneryOccludesVehicle(sceneryCamera,screen,new THREE.Sphere(new THREE.Vector3(20,2,8),1)),false)
async function scan(path: string) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name === 'wheels') continue
    const next = join(path, entry.name)
    if (entry.isDirectory()) await scan(next)
    else if (entry.name.endsWith('.xml')) {
      const source = await readFile(next, 'utf8')
      const meshRef = /<PhysicsModel\b[^>]*\bMesh="([^"]+)"/.exec(source)?.[1]
      if (/<TruckAddon\b/.test(source) && meshRef) addonsByName.set(entry.name.slice(0,-4),meshRef)
      if (!/<Truck\b/.test(source)) continue
      for (const match of source.matchAll(/\bDefaultAddon="([^"]+)"/g)) defaultAddons.add(match[1])
      const match = /<PhysicsModel\b[^>]*\bMesh="([^"]+)"/.exec(source)
      if (match) references.add(match[1].replaceAll('\\', '/'))
    }
  }
}
await scan(join(root, 'classes/trucks')); await scan(join(root, '_dlc'))
let models = 0, parts = 0
const report: unknown[] = []
for (const ref of references) {
  try {
    const bytes = await readGameEntry(join(game, 'preload/paks/client/shared.pak'), '[meshes]/' + ref.replaceAll('/', '_'))
    assert.ok(bytes, `Missing ${ref}`)
    const model = parseCombineMesh(bytes)
    assert.ok(model.children.every(m => !/(?:^|_)hp_|_+\s*(?:cockpit|windshield)/i.test(m.name)), `First-person/helper mesh leaked into exterior: ${ref}`)
    const box = new THREE.Box3().setFromObject(model)
    const size = box.getSize(new THREE.Vector3())
    assert.ok(size.toArray().every(n => Number.isFinite(n) && n > 0 && n < 100), `Invalid bounds ${ref}: ${size.toArray()}`)
    for (const aspect of [.45, .7, 1, 1.8, 3]) {
      const camera = new THREE.PerspectiveCamera(36, aspect, .05, 250)
      fitVehicleCamera(camera, box)
      for (const x of [box.min.x,box.max.x]) for (const y of [box.min.y,box.max.y]) for (const z of [box.min.z,box.max.z]) {
        const p = new THREE.Vector3(x,y,z).project(camera)
        assert.ok(Math.abs(p.x) < 1 && Math.abs(p.y) < 1 && Math.abs(p.z) < 1, `Clipped ${ref} at aspect ${aspect}`)
      }
    }
    report.push({ ref, size: size.toArray(), parts: model.children.map(o => o.name) })
    models++; parts += model.children.length; disposeGameModel(model)
    if (models % 25 === 0) console.log(`Modelos verificados: ${models}/${references.size}`)
  } catch (error) { failures.push({ ref, error: String(error) }) }
}
for (const ref of ['wheels/tire_medium_highway_double_1', 'wheels/tire_medium_allterrain_double_1', 'wheels/rim_medium_highway_allterrain_double_1', 'wheels/tire_medium_highway_double_front_1', 'wheels/rim_medium_highway_allterrain_double_front_1']) {
  const bytes = await readGameEntry(join(game, 'preload/paks/client/shared.pak'), '[meshes]/' + ref.replaceAll('/', '_'))
  assert.ok(bytes)
  const model = parseCombineMesh(bytes); assert.ok(model.children.length)
  for (const rear of [false,true]) {
    selectWheelVariant(model,rear)
    const size = visibleVehicleBounds(model).getSize(new THREE.Vector3())
    assert.ok(size.x>.5 && size.y>.5, 'A wheel variant has no visible tire/rim: '+ref)
  }
  disposeGameModel(model)
  assert.throws(() => parseCombineMesh(bytes.subarray(0, 100)))
}
console.log(JSON.stringify({ references: references.size, models, parts, failures }, null, 2))
let accessories = 0
for (const name of defaultAddons) {
  const ref = addonsByName.get(name)
  if (!ref) continue
  const bytes = await readGameEntry(join(game,'preload/paks/client/shared.pak'),'[meshes]/'+ref.replaceAll('\\','/').replaceAll('/','_'))
  assert.ok(bytes, 'Missing default accessory: '+ref)
  const model = parseCombineMesh(bytes), box = new THREE.Box3().setFromObject(model)
  assert.ok([...box.min.toArray(),...box.max.toArray()].every(n=>Number.isFinite(n) && Math.abs(n)<100), 'Invalid accessory pose: '+ref)
  if (name === 'aac_58dw_bumper_default') {
    const center = box.getCenter(new THREE.Vector3())
    assert.ok(Math.abs(center.x-1.816)<.01 && Math.abs(center.y-.535)<.01, 'Accessory skin lost its bind pose')
  }
  disposeGameModel(model); accessories++
  if (accessories % 50 === 0) console.log('Accesorios originales verificados: '+accessories)
}
console.log('Accesorios predeterminados verificados: '+accessories)
await mkdir('.vite', { recursive: true })
await writeFile('.vite/model-report.json', JSON.stringify(report, null, 2))
assert.ok(models >= 150, 'Insufficient vehicle model coverage')
assert.deepEqual(failures, [])
