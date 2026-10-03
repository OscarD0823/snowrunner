import assert from 'node:assert/strict'
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import * as THREE from 'three'
import { join } from 'node:path'
import { readGameEntry } from '../src/modules/images/game-archive'
import { parseCombineMesh, disposeGameModel } from '../src/renderer/utilities/combine-mesh'
import { fitVehicleCamera } from '../src/renderer/utilities/vehicle-framing'

const game = process.env.SNOWRUNNER_GAME_ROOT ?? 'E:/SteamLibrary/steamapps/common/SnowRunner'
const root = join(game, '.snowrunner-studio/mainTemp/[media]')
const references = new Set<string>(), failures: Array<{ ref: string; error: string }> = []
async function scan(path: string) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    if (entry.isDirectory() && (entry.name === 'addons' || entry.name === 'wheels')) continue
    const next = join(path, entry.name)
    if (entry.isDirectory()) await scan(next)
    else if (entry.name.endsWith('.xml')) {
      const source = await readFile(next, 'utf8')
      if (!/<Truck\b/.test(source)) continue
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
for (const ref of ['wheels/tire_medium_highway_double_1', 'wheels/tire_medium_allterrain_double_1', 'wheels/rim_medium_highway_allterrain_double_1']) {
  const bytes = await readGameEntry(join(game, 'preload/paks/client/shared.pak'), '[meshes]/' + ref.replaceAll('/', '_'))
  assert.ok(bytes)
  const model = parseCombineMesh(bytes); assert.ok(model.children.length); disposeGameModel(model)
  assert.throws(() => parseCombineMesh(bytes.subarray(0, 100)))
}
console.log(JSON.stringify({ references: references.size, models, parts, failures }, null, 2))
await mkdir('.vite', { recursive: true })
await writeFile('.vite/model-report.json', JSON.stringify(report, null, 2))
assert.ok(models >= 150, 'Insufficient vehicle model coverage')
assert.deepEqual(failures, [])
