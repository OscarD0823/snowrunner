<template>
  <section class="drive-preview" :data-model-state="state" :data-preview-context="previewContext">
    <div class="drive-preview__toolbar">
      <strong>{{ texts.title }}</strong>
      <div>
        <button :aria-label="texts.motion" @click="toggleMotion">{{ moving ? 'Ⅱ' : '▶' }}</button>
        <select v-model="terrain" :aria-label="texts.terrain">
          <option v-for="value in ['auto', 'forest', 'mud', 'snow', 'rock'] as const" :key="value" :value="value">{{ texts[value] }}</option>
        </select>
        <button :aria-label="texts.reset" :title="texts.reset" @click="stage?.resetCamera()">↺</button>
      </div>
    </div>
    <div ref="host" class="drive-preview__scene" :aria-label="name">
      <div v-if="state !== 'ready'" class="drive-preview__fallback">
        <img :src="image" :alt="name">
        <span>{{ state === 'loading' ? texts.loading : texts.unavailable }}</span>
      </div>
    </div>
    <div v-if="(previewContext === 'wheels' && tireChoices.length) || (previewContext === 'suspensions' && suspensionChoices.length)" class="drive-preview__selectors">
      <label v-if="previewContext === 'wheels' && tireChoices.length" data-preview-kind="wheels">{{ texts.tires }}
        <select v-model="tireId" @change="changeTires">
          <option v-for="(item, i) in tireChoices" :key="i" :value="i">{{ item.label }}</option>
        </select>
      </label>
      <label v-if="previewContext === 'suspensions' && suspensionChoices.length" data-preview-kind="suspensions">{{ texts.suspension }}
        <select v-model="suspensionId" @change="updateAppearance">
          <option v-for="(item, i) in suspensionChoices" :key="i" :value="i">{{ item.label }}</option>
        </select>
      </label>
    </div>
    <p>{{ state === 'ready' ? texts.original : texts.cover }} · {{ texts.help }}</p>
  </section>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { loadLocalization, Localization, LocalizationStrings } from '@localization/renderer'
import { XMLElement, Wheel, type TruckXML, type Wheels, type Suspensions } from '@modules/xml/renderer'
import { di } from '@utilities/di/container'
import { GAME_TEXTS_TOKEN, IMAGES_TOKEN, DIRS_TOKEN } from '@utilities/di/renderer/tokens'
import type { IDir, IFile } from '@modules/files/types'
import { useEditorStore } from '@renderer/pages/general/store/editor'
import { DrivingStage, type Terrain } from '@renderer/utilities/driving-stage'
import { disposeGameModel, loadGameMesh } from '@renderer/utilities/combine-mesh'
import { addonPlacement } from '@renderer/utilities/addon-placement'
import { wheelPlacement } from '@renderer/utilities/wheel-placement'
import { selectWheelVariant } from '@renderer/utilities/wheel-variant'
import type { VehiclePreviewContext } from '@renderer/utilities/vehicle-appearance'

const texts = loadLocalization(new Localization({
  title: new LocalizationStrings().es('Vista del vehículo').en('Vehicle view'),
  loading: new LocalizationStrings().es('Leyendo el modelo del juego…').en('Reading the game model…'),
  unavailable: new LocalizationStrings().es('Modelo no compatible. Se muestra la carátula.').en('Unsupported model. Showing the cover.'),
  original: new LocalizationStrings().es('Modelo original · vista 3D').en('Original model · 3D view'),
  cover: new LocalizationStrings().es('Carátula · no es una vista 3D').en('Cover · not a 3D view'),
  help: new LocalizationStrings().es('Arrastra para girar y usa la rueda para acercar. La escena no simula la física del juego.').en('Drag to orbit and scroll to zoom. The scene does not simulate game physics.'),
  tires: new LocalizationStrings().es('Neumáticos · vista previa').en('Tires · preview'),
  suspension: new LocalizationStrings().es('Suspensión · vista previa').en('Suspension · preview'),
  motion: new LocalizationStrings().es('Pausar o reanudar movimiento').en('Pause or resume movement'),
  terrain: new LocalizationStrings().es('Terreno').en('Terrain'),
  reset: new LocalizationStrings().es('Encuadrar vehículo completo').en('Fit entire vehicle'),
  auto: new LocalizationStrings().es('Ruta automática').en('Automatic route'),
  forest: new LocalizationStrings().es('Bosque').en('Forest'),
  mud: new LocalizationStrings().es('Barro').en('Mud'),
  snow: new LocalizationStrings().es('Nieve').en('Snow'),
  rock: new LocalizationStrings().es('Rocas').en('Rocks')
}))
const props = defineProps<{ xml: TruckXML; name: string; image: string; previewContext?: VehiclePreviewContext; selectedTire?: string; selectedSuspension?: string }>()
const images = di.resolve(IMAGES_TOKEN), gameTexts = di.resolve(GAME_TEXTS_TOKEN)
const host = ref<HTMLElement>(), state = ref('loading'), moving = ref(!matchMedia('(prefers-reduced-motion: reduce)').matches)
const terrain = ref<Terrain>('auto')
let stage: DrivingStage | undefined, disposed = false, request = 0, poll: ReturnType<typeof setInterval> | undefined
let body: THREE.Group | undefined, wheelModels: THREE.Group[] = []
const individualWheels = new Map<string, { mesh: string; radius: number; width: number }>()
type TireChoice = { label: string; mesh: string; rim?: string; scale: () => number; xml: Wheels | undefined; name: string }
type SuspensionChoice = { label: string; name: string; height: () => number }
const tireChoices = ref<TireChoice[]>([]), suspensionChoices = ref<SuspensionChoice[]>([])
const tireId = ref(0), suspensionId = ref(0)
const meshRef = computed(() => props.xml.PhysicsModel?.getAttrWT('Mesh')?.str)
const defaultHeight = ref(0)
watch(terrain, value => { if (stage) stage.terrain = value })
watch(() => props.selectedTire, mesh => {
  const index = tireChoices.value.findIndex(choice => choice.mesh === mesh)
  if (index >= 0) { tireId.value = index; if (state.value === 'ready') void changeTires() }
})
watch(() => props.selectedSuspension, name => {
  const index = suspensionChoices.value.findIndex(choice => choice.name === name)
  if (index >= 0) { suspensionId.value = index; updateAppearance() }
})
onMounted(async () => {
  try {
    stage = new DrivingStage(host.value!)
    if (useEditorStore().info.mod) throw new Error('Vista de modelos personalizados compilados aún no disponible')
    const asset = meshRef.value ? await images.getMesh(meshRef.value) : undefined
    if (!asset) throw new Error('No compatible model reference')
    const model = await loadGameMesh(asset)
    if (disposed) { disposeGameModel(model); return }
    body = model
    await loadDefaultAddons(model)
    if (disposed) return
    stage.setBody(model)
    await loadOptions()
    host.value!.dataset.expectedWheels = String(props.xml.TruckData?.Wheels?.Wheels.length ?? 0)
    const selectedTireIndex = tireChoices.value.findIndex(choice => choice.mesh === props.selectedTire)
    const selectedSuspensionIndex = suspensionChoices.value.findIndex(choice => choice.name === props.selectedSuspension)
    if (selectedTireIndex >= 0) tireId.value = selectedTireIndex
    if (selectedSuspensionIndex >= 0) suspensionId.value = selectedSuspensionIndex
    await changeTires()
    if (disposed) return
    updateAppearance(); stage.resetCamera(); state.value = 'ready'
    host.value!.dataset.materials = JSON.stringify(model.userData.materials)
    host.value!.dataset.addons = JSON.stringify(model.userData.addons)
    poll = setInterval(updateAppearance, 300)
  } catch (error) { if (!disposed) { state.value = 'unavailable'; console.warn('Vista del vehículo:', error) } }
})
async function loadDefaultAddons(model: THREE.Group) {
  const dirs = di.resolve(DIRS_TOKEN), info = useEditorStore().info
  if (info.mod) return
  const baseName = meshRef.value?.split(/[\\/]/).pop() ?? ''
  const roots = [dirs.classes.dir('trucks')]
  if (info.dlc) roots.unshift(dirs.dlc.dir(info.dlc, 'classes', 'trucks'))
  // Some DLC vehicles reuse an accessory from a different DLC.
  if (await dirs.dlc.exists()) for (const entry of await dirs.dlc.read()) {
    if (entry.basename() !== info.dlc && await entry.isDir()) roots.push(entry.asDir().dir('classes','trucks'))
  }
  const summary = { loaded: [] as string[], nonvisual: [] as string[], missingFiles: [] as string[], unavailable: [] as string[] }
  const discovered = new Map<IDir, Promise<IFile[]>>()
  model.userData.addons = summary
  const sockets = props.xml.selectAll('GameData > AddonSockets')
  for (const socket of sockets.slice(0, 40)) {
    const name = socket.getAttr('DefaultAddon')?.str
    if (!name || !/^[a-z0-9_-]+$/i.test(name)) continue
    let found = false
    let defined = false
    try {
      for (const root of roots) {
        let candidates = [root.dir(baseName + '_tuning').file(name + '.xml'), root.dir('addons').file(name + '.xml'), root.file(name + '.xml')]
        const existing = await Promise.all(candidates.map(file=>file.exists()))
        candidates = candidates.filter((_,i)=>existing[i])
        // Variants such as ANK CIVIL reuse the parent truck's tuning folder.
        if (!candidates.length) {
          if (!discovered.has(root)) discovered.set(root,root.findFiles({ext:'xml',recursive:true}))
          candidates = (await discovered.get(root)!).filter(file=>file.name === name)
        }
        for (const file of candidates) {
          defined = true
          const xml = await XMLElement.from(file), mesh = xml?.select('TruckAddon > PhysicsModel')?.getAttr('Mesh')?.str
          if (!mesh) {
            if (xml?.select('TruckAddon')) { summary.nonvisual.push(name); found = true; break }
            continue
          }
          const asset = await images.getMesh(mesh)
          if (!asset) continue
          const addon = await loadGameMesh(asset,model.userData.paint)
          if (disposed) { disposeGameModel(addon); return }
          const install = xml?.select('TruckAddon > GameData > InstallSocket')
          const installType = install?.getAttr('Type')?.str
          const attachment = socket.selectAll('Socket').find(s => s.getAttr('Names')?.str.split(',').map(n => n.trim()).includes(installType ?? ''))
          // ParentFrame controls dynamic attachment, not the authored rest coordinates.
          // Applying its matrix here a second time made bumpers, horns and spare tires float.
          addon.position.copy(addonPlacement(attachment?.getAttr('Offset')?.str, install?.getAttr('Offset')?.str))
          model.add(addon); found = true; break
        }
        if (found) break
      }
    } catch { /* An optional accessory must not prevent opening a vehicle. */ }
    if (found && !summary.nonvisual.includes(name)) summary.loaded.push(name)
    else if (!found) (defined ? summary.unavailable : summary.missingFiles).push(name)
  }
}
async function loadOptions() {
  const data = props.xml.TruckData, info = useEditorStore().info
  if (!data) return
  const defaultType = data.Wheels?.DefaultWheelType
  if (!defaultType && data.Wheels?.Wheels.length) {
    const dirs = di.resolve(DIRS_TOKEN)
    for (const type of new Set(data.Wheels.Wheels.map(wheel=>wheel.Type).filter((type): type is string => Boolean(type)))) {
      if (!/^[a-z0-9_-]+$/i.test(type)) continue
      const files = [dirs.classes.dir('wheels').file(type+'.xml')]
      if (info.dlc) files.unshift(dirs.dlc.dir(info.dlc,'classes','wheels').file(type+'.xml'))
      for (const file of files) {
        if (!await file.exists()) continue
        const wheel = await Wheel.from(file), mesh = wheel?.getAttrWT('Mesh')?.str
        if (mesh) { individualWheels.set(type,{mesh,radius:Number(wheel?.Radius ?? .5),width:Number(wheel?.Width ?? .5)}); break }
      }
    }
  }
  const candidates = data.CompatibleWheels
  const wheels = await data.Wheels?.defaultWheel(info)
  const add = (pack: Wheels | undefined, scale: () => number) => {
    const defaultRim = data.Wheels?.getAttrWT('DefaultRim')?.str
    const rims = pack?.TruckRims?.Rims ?? []
    const rim = (rims.find(rim => rim.getAttrWT('Name')?.str === defaultRim) ?? rims[0])?.getAttrWT('Mesh')?.str
    for (const tire of pack?.TruckTires?.Tires ?? []) {
      const mesh = tire.getAttrWT('Mesh')?.str
      if (!mesh) continue
      const label = gameTexts.get(tire.GameData?.UiDesc?.UiName, info.mod) ?? tire.Name ?? mesh.split('/').pop() ?? ''
      tireChoices.value.push({ label: `${label} · ${Math.round(scale() * 2 / .0254)}″`, mesh, rim, scale, xml: pack, name: tire.Name ?? '' })
    }
  }
  const defaultScale = () => Number(candidates.find(w => w.Type === defaultType)?.Scale ?? candidates[0]?.Scale ?? .6)
  add(wheels, defaultScale)
  if (!wheels) {
    const file = await data.Wheels?.defaultWheelFile(info)
    const single = file ? await Wheel.from(file) : undefined
    const mesh = single?.getAttrWT('Mesh')?.str
    if (mesh) tireChoices.value.push({ label: `${texts.tires} · ${Math.round(Number(single!.Radius ?? .6) * 2 / .0254)}″`, mesh, scale: () => Number(single!.Radius ?? .6), xml: undefined, name: '' })
  }
  for (const wheel of candidates) {
    if (wheel.Type !== defaultType) add(await wheel.wheelSet(info), () => Number(wheel.Scale ?? .6))
  }
  const defaultTire = data.Wheels?.getAttrWT('DefaultTire')?.str
  tireId.value = Math.max(0, tireChoices.value.findIndex(t => t.name === defaultTire))
  const packs: Suspensions[] = await data.SuspensionSocket?.suspensions(info) ?? []
  for (const pack of packs) for (const set of pack.Sets) {
    suspensionChoices.value.push({
      name: set.Name ?? '', label: gameTexts.get(set.GameData?.UiDesc?.UiName, info.mod) ?? set.Name ?? '',
      height: () => set.Suspensions.reduce((sum, item) => sum + Number(item.Height ?? 0), 0) / Math.max(set.Suspensions.length, 1)
    })
  }
  suspensionId.value = Math.max(0, suspensionChoices.value.findIndex(s => s.name === data.SuspensionSocket?.Default))
  defaultHeight.value = suspensionChoices.value[suspensionId.value]?.height() ?? 0
}
async function changeTires() {
  const current = ++request, choice = tireChoices.value[tireId.value]
  if (!stage) return
  if (!choice && individualWheels.size) {
    const sources = new Map<string, THREE.Group>(), loaded: THREE.Group[] = []
    try {
      const units: Parameters<DrivingStage['setWheels']>[0] = []
      for (const wheel of props.xml.TruckData?.Wheels?.Wheels ?? []) {
        const spec = individualWheels.get(wheel.Type ?? '')
        if (!spec) throw new Error('Missing individual wheel: '+wheel.Type)
        let source = sources.get(spec.mesh)
        if (!source) {
          const asset = await images.getMesh(spec.mesh)
          if (!asset) throw new Error('Missing wheel mesh: '+spec.mesh)
          source = await loadGameMesh(asset); sources.set(spec.mesh,source); loaded.push(source)
        }
        const pos = wheel.Pos, right = wheel.getAttrWT('RightSide')?.str === 'true'
        // Single TruckWheel meshes already have their authored radius/width.
        const model = source.clone(true), size = new THREE.Box3().setFromObject(source).getSize(new THREE.Vector3())
        const radius = Math.max(size.x,size.y)/2
        model.scale.set(spec.radius/radius,spec.radius/radius,spec.width/Math.max(size.z,.01))
        const parent = wheel.getAttrWT('ParentFrame')?.str
        const frame = wheel.getAttrWT('PosInLocalFrame')?.str === 'true' && parent ? body?.userData.frames?.[parent] : undefined
        units.push({model,...wheelPlacement([Number(pos?.x ?? 0),Number(pos?.y ?? spec.radius),Number(pos?.z ?? 0)],right,frame),scale:1,right,radius:spec.radius})
      }
      if (disposed || current !== request) { loaded.forEach(disposeGameModel); return }
      stage.setWheels(units); wheelModels.forEach(disposeGameModel); wheelModels=loaded
      host.value!.dataset.expectedWheels = String(props.xml.TruckData?.Wheels?.Wheels.length ?? 0)
    } catch (error) { loaded.forEach(disposeGameModel); throw error }
    return
  }
  if (!choice) return
  try {
    const asset = await images.getMesh(choice.mesh), rimAsset = choice.rim ? await images.getMesh(choice.rim) : undefined
    if (!asset) return
    const tire = await loadGameMesh(asset)
    if (rimAsset) tire.add(await loadGameMesh(rimAsset))
    if (disposed || current !== request) { disposeGameModel(tire); return }
    const units = (props.xml.TruckData?.Wheels?.Wheels ?? []).map(wheel => {
      const pos = wheel.Pos
      const xyz: [number, number, number] = [Number(pos?.x ?? 0), Number(pos?.y ?? choice.scale()), Number(pos?.z ?? 0)]
      const right = wheel.getAttrWT('RightSide')?.str === 'true'
      const parent = wheel.getAttrWT('ParentFrame')?.str
      const frame = wheel.getAttrWT('PosInLocalFrame')?.str === 'true' && parent ? body?.userData.frames?.[parent] : undefined
      const model = tire.clone(true)
      // Composite wheels contain front and double rear versions in one file.
      selectWheelVariant(model,wheel.Location === 'rear')
      return { model, ...wheelPlacement(xyz,right,frame), scale: choice.scale(), right }
    })
    stage.setWheels(units)
    host.value!.dataset.tire = choice.mesh
    host.value!.dataset.expectedWheels = String(props.xml.TruckData?.Wheels?.Wheels.length ?? 0)
    wheelModels.forEach(disposeGameModel); wheelModels = [tire]
    updateAppearance()
  } catch (error) { console.warn('No se pudo mostrar ese neumático.', error) }
}
function updateAppearance() {
  const choice = tireChoices.value[tireId.value]
  stage?.setAppearance((suspensionChoices.value[suspensionId.value]?.height() ?? defaultHeight.value) - defaultHeight.value, choice?.xml ? Number(choice.xml.Radius ?? 1) : 1)
}
function toggleMotion() { moving.value = !moving.value; if (stage) stage.moving = moving.value }
onBeforeUnmount(() => { disposed = true; request++; clearInterval(poll); stage?.dispose(); if (body) disposeGameModel(body); wheelModels.forEach(disposeGameModel) })
</script>
<style scoped>
.drive-preview { display: flex; flex-direction: column; flex: 1 1 0; min-height: 0; border: 1px solid #d5e0e6; border-radius: 13px; overflow: hidden; width: 100%; background: #13222c; }
.drive-preview__toolbar { padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; gap: 8px; color: #e2e9ec; font-size: 12px; }
.drive-preview__toolbar>div { display: flex; gap: 6px; }
button, select { font: inherit; border: 1px solid #52636d; background: #213541; color: #eff4f6; border-radius: 6px; padding: 4px 8px; cursor: pointer; }
select { min-width: 0; max-width: 100%; }
.drive-preview__scene { flex: 1 1 0; min-height: 100px; position: relative; overflow: hidden; }
.drive-preview__scene :deep(canvas) { display: block; width: 100%; height: 100%; touch-action: none; }
.drive-preview__fallback { position: absolute; inset: 0; z-index: 1; display: flex; align-items: center; justify-content: center; gap: 14px; padding: 20px; background: #d5e0e8e8; color: #314859; font-size: 12px; }
.drive-preview__fallback img { max-height: 100%; max-width: 45%; object-fit: contain; }
.drive-preview__selectors { display: grid; grid-template-columns: 1fr; padding: 9px 12px 0; color: #c8d6dc; font-size: 11px; }
label { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
p { margin: 0; padding: 8px 12px; color: #99acb7; font-size: 10px; }
@container (max-width: 380px) { .drive-preview__toolbar { flex-wrap: wrap; padding: 8px; } .drive-preview__toolbar>div { flex-wrap: wrap; } p { font-size: 9px; padding: 6px; } .drive-preview__selectors { padding: 8px; } }
</style>
