import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { readGameEntry } from '../src/modules/images/game-archive'
import { parseCombineMesh, disposeGameModel } from '../src/renderer/utilities/combine-mesh'

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
for (const ref of references) {
  try {
    const bytes = await readGameEntry(join(game, 'preload/paks/client/shared.pak'), '[meshes]/' + ref.replaceAll('/', '_'))
    assert.ok(bytes, `Missing ${ref}`)
    const model = parseCombineMesh(bytes)
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
assert.ok(models >= 150, 'Insufficient vehicle model coverage')
assert.deepEqual(failures, [])
