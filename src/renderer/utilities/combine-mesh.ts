// Format parsing adapted from Brooen/Snowrunner-Model-Importer (MIT).
// Copyright (c) Brooen. Full notice: THIRD_PARTY_NOTICES.md.
import * as THREE from 'three'
import { DDSLoader } from 'three/addons/loaders/DDSLoader.js'
import type { GameMeshAsset } from '@modules/images/types'

type Sub = { material: number; start: number; count: number }
type Node = { id: number; parent: number; name: string; matrix: THREE.Matrix4; mesh?: THREE.Mesh; skinned: boolean }
const modelTextures = new WeakMap<THREE.Object3D, THREE.Texture[]>()
class Reader {
  offset = 0
  readonly view: DataView
  constructor(readonly data: Uint8Array) { this.view = new DataView(data.buffer, data.byteOffset, data.byteLength) }
  skip(n: number) { if (n < 0 || this.offset + n > this.data.length) throw new Error(`Invalid mesh range at ${this.offset}`); this.offset += n }
  i16() { const o = this.offset; this.skip(2); return this.view.getInt16(o, true) }
  u16() { const o = this.offset; this.skip(2); return this.view.getUint16(o, true) }
  i32() { const o = this.offset; this.skip(4); return this.view.getInt32(o, true) }
  f32() { const o = this.offset; this.skip(4); const n = this.view.getFloat32(o, true); if (!Number.isFinite(n)) throw new Error('Invalid mesh coordinate'); return n }
  count(max: number) { const n = this.i32(); if (n < 0 || n > max) throw new Error(`Invalid mesh count: ${n} at ${this.offset}`); return n }
  floats(n: number) { return Array.from({ length: n }, () => this.f32()) }
  name() { const n = this.count(4096); if (!n) throw new Error('Invalid mesh name'); const start = this.offset; this.skip(n); return new TextDecoder('windows-1251').decode(this.data.subarray(start, start + n - 1)) }
  matrix() { return new THREE.Matrix4().fromArray(this.floats(16)) }
}

export function parseCombineMesh(data: Uint8Array, trace?: (data: unknown) => void) {
  const r = new Reader(data), xmlLength = r.count(1024 * 1024)
  if (xmlLength < 3) throw new Error('Not a CombineXMesh')
  const xml = new TextDecoder('windows-1251').decode(data.subarray(4, xmlLength + 2))
  if (!xml.trimStart().startsWith('<CombineXMesh')) throw new Error('Not a CombineXMesh')
  r.skip(xmlLength - 2); r.skip(6)
  const count = r.count(65535); r.skip(24); r.i32()
  const nodes: Node[] = []
  for (let index = 0; index < count; index++) {
    const parent = r.i16(), id = r.i16(), linkIn = r.i16(); r.i16()
    const name = r.name(), matrix = r.matrix(), vertexCount = r.count(1000000)
    trace?.({ index, name, offset: r.offset, vertexCount })
    const node: Node = { id, parent, name, matrix, skinned: false }
    nodes.push(node)
    if (!vertexCount) continue
    const triangleCount = r.count(2000000), meshName = r.name(); r.i32()
    const materialCount = r.count(4096); r.i32()
    const materials = Array.from({ length: materialCount }, () => r.name())
    const links = r.count(4096); r.skip(links * 64); r.i16()
    let subs: Sub[] = []
    const sub = () => { const material = r.i32(), start = r.i32(), count = r.i32(); r.i32(); r.i32(); return { material, start, count } }
    if (!links) {
      r.skip(24); const n = r.count(4096); subs = Array.from({ length: n }, sub)
    } else {
      r.i16(); const n = r.count(4096), counts = Array.from({ length: n }, () => r.count(4096))
      subs = counts.map(n => { const s = sub(); r.skip(n * 4); return s })
      r.skip(links * 2 + 24 + 24)
    }
    const defCount = r.count(64), definitions: number[] = []
    for (let i = 0; i < defCount; i++) { r.i16(); r.i16(); r.u16(); definitions.push(r.u16()) }
    r.i32(); r.i32()
    const positions = new Float32Array(vertexCount * 3), uv = new Float32Array(vertexCount * 2), normals = new Float32Array(vertexCount * 3)
    for (let v = 0; v < vertexCount; v++) {
      for (const type of definitions) {
        if (type === 0) positions.set(r.floats(3), v * 3)
        else if (type === 5) uv.set(r.floats(2), v * 2)
        else if (type === 0x105) {
          for (let axis = 0; axis < 3; axis++) { const b = r.data[r.offset + axis]; normals[v * 3 + axis] = (b - 128) / (b >= 128 ? 127 : 128) }
          r.skip(4)
        } else if (type === 0x605) r.skip(8)
        else if ([0x205, 0x305, 0x405, 0x505].includes(type)) r.skip(4)
        else throw new Error(`Unsupported vertex item ${type}`)
      }
    }
    const triangles = new Uint32Array(triangleCount * 3)
    for (let i = 0; i < triangles.length; i++) { triangles[i] = r.u16(); if (triangles[i] >= vertexCount) throw new Error('Invalid mesh triangle') }
    if (links || linkIn) r.i16()
    const flag = r.i16()
    trace?.({ name, flag, offset: r.offset })
    if (flag >= 4 && flag <= 100) { r.skip(1); const n = r.i16(); r.skip(1); r.skip(n + 16); if (r.i16() > 100) r.skip(64) }
    if (flag > 100) r.skip(64)
    // Collision volumes and alternate LODs are not visible geometry.
    if (/^cdt(?:_|\d)|_cdt$|_lod[1-9]|_collision|(?:^|_)hp_|_+\s*(?:windshield|cockpit)/i.test(meshName) || /_lod[1-9]/i.test(name)) continue
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3)); geometry.setIndex(new THREE.BufferAttribute(triangles, 1))
    if (definitions.includes(5)) geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
    if (definitions.includes(0x105)) geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
    else geometry.computeVertexNormals()
    for (const s of subs) geometry.addGroup(s.start * 3, s.count * 3, s.material)
    const mats = materials.map(name => { const m = new THREE.MeshStandardMaterial({ color: 0xc8c9c4, roughness: .8, side: THREE.DoubleSide }); m.name = name; return m })
    const mesh = new THREE.Mesh(geometry, mats.length ? mats : new THREE.MeshStandardMaterial())
    mesh.name = meshName; mesh.castShadow = true; mesh.receiveShadow = true
    node.mesh = mesh; node.skinned = links > 0
  }
  const byId = new Map(nodes.map(n => [n.id, n])), worlds = new Map<Node, THREE.Matrix4>()
  function world(node: Node, seen = new Set<Node>()): THREE.Matrix4 {
    const cached = worlds.get(node); if (cached) return cached
    if (seen.has(node)) throw new Error('Cyclic mesh hierarchy')
    seen.add(node); const parent = byId.get(node.parent)
    const m = parent && parent !== node ? world(parent, seen).clone().multiply(node.matrix) : node.matrix.clone()
    worlds.set(node, m); return m
  }
  const model = new THREE.Group()
  for (const node of nodes) {
    if (!node.mesh) continue
    if (!node.skinned) node.mesh.geometry.applyMatrix4(world(node))
    model.add(node.mesh)
  }
  model.userData.xml = xml
  model.userData.nodes = nodes.length
  model.userData.frames = Object.fromEntries(nodes.map(n => [n.name, world(n).toArray()]))
  if (!model.children.length) throw new Error('Mesh has no visible geometry')
  return model
}

export async function loadGameMesh(asset: GameMeshAsset) {
  const response = await fetch(asset.meshUrl)
  if (!response.ok) throw new Error('Model could not be read')
  const model = parseCombineMesh(new Uint8Array(await response.arrayBuffer()))
  try {
    const xml = new DOMParser().parseFromString(model.userData.xml, 'application/xml'), defs = new Map<string, Element>()
    xml.querySelectorAll('Material').forEach(element => defs.set(element.getAttribute('Name') ?? '', element))
    const loader = new DDSLoader(), textures = new Map<string, THREE.CompressedTexture>()
    const colorRefs = new Set([...defs.values()].map(def => def.getAttribute('AlbedoMap')))
    await Promise.all(Object.entries(asset.textures).map(async ([ref, url]) => {
      try {
        const texture = await loader.loadAsync(url)
        if (!texture.image?.width || !texture.mipmaps.length) { texture.dispose(); return }
        texture.colorSpace = colorRefs.has(ref) ? THREE.SRGBColorSpace : THREE.NoColorSpace
        texture.anisotropy = 4; textures.set(ref, texture)
      } catch { /* Unavailable texture: neutral material, never a fake model. */ }
    }))
    model.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        const def = defs.get(material.name), ref = def?.getAttribute('AlbedoMap')
        if (material instanceof THREE.MeshStandardMaterial) {
          material.map = ref ? textures.get(ref) ?? null : null
          material.normalMap = textures.get(def?.getAttribute('NormalMap') ?? '') ?? null
          const normalScale = finiteAttribute(def, 'NormalScale', 1)
          material.normalScale.set(normalScale, -normalScale) // DirectX normal maps have an inverted green channel.
          const shading = textures.get(def?.getAttribute('ShadingMap') ?? '') ?? null
          material.metalnessMap = shading; material.roughnessMap = shading; material.aoMap = shading
          material.metalness = shading ? finiteAttribute(def, 'MetalnessScale', 1) : 0
          material.roughness = shading ? finiteAttribute(def, 'RoughnessScale', 1) : .8
          material.aoMapIntensity = finiteAttribute(def, 'AmbientOcclusionIntensity', 1)
          material.envMapIntensity = Math.min(3, finiteAttribute(def, 'ReflectivityMultiplier', 1))
          const metalBias = finiteAttribute(def, 'MetalnessBias', 0), roughBias = finiteAttribute(def, 'RoughnessBias', 0)
          // Saber packs metalness/R, roughness/G, AO/B; Three expects AO/R, roughness/G, metalness/B.
          material.onBeforeCompile = shader => {
            shader.uniforms.gameMetalBias = { value: metalBias }; shader.uniforms.gameRoughBias = { value: roughBias }
            shader.fragmentShader = 'uniform float gameMetalBias;\nuniform float gameRoughBias;\n' + shader.fragmentShader
            shader.fragmentShader = shader.fragmentShader
              .replace('#include <metalnessmap_fragment>', THREE.ShaderChunk.metalnessmap_fragment.replace('texelMetalness.b', 'texelMetalness.r') + '\nmetalnessFactor = clamp(metalnessFactor + gameMetalBias, 0.0, 1.0);')
              .replace('#include <roughnessmap_fragment>', THREE.ShaderChunk.roughnessmap_fragment + '\nroughnessFactor = clamp(roughnessFactor + gameRoughBias, 0.04, 1.0);')
              .replace('#include <aomap_fragment>', THREE.ShaderChunk.aomap_fragment.replace('vAoMapUv ).r', 'vAoMapUv ).b'))
          }
          material.customProgramCacheKey = () => 'saber-pbr-v2'
          material.color.set(material.map ? 0xffffff : /glass/i.test(material.name) ? 0x697f86 : 0xc8c9c4)
          if (def?.getAttribute('Blending') === 'alpha') { material.transparent = true; material.opacity = 1; material.depthWrite = false; material.side = THREE.FrontSide }
          if (def?.getAttribute('AlphaKill') === 'true') material.alphaTest = .4
          material.needsUpdate = true
        }
      }
    })
    // Object3D.clone serializes userData: keep GPU resources out of it.
    modelTextures.set(model, [...textures.values()])
    model.userData.materials = { expected: Object.keys(asset.textures).length, loaded: textures.size }
    return model
  } catch (error) { disposeGameModel(model); throw error }
}

function finiteAttribute(def: Element | undefined, name: string, fallback: number) {
  const raw = def?.getAttribute(name), value = raw === null || raw === undefined ? fallback : Number(raw)
  return Number.isFinite(value) ? value : fallback
}

export function disposeGameModel(model: THREE.Object3D) {
  const textures = new Set<THREE.Texture>()
  model.traverse(object => {
    for (const texture of modelTextures.get(object) ?? []) textures.add(texture)
    modelTextures.delete(object)
    if (!(object instanceof THREE.Mesh)) return
    object.geometry.dispose()
    for (const m of Array.isArray(object.material) ? object.material : [object.material]) {
      for (const value of Object.values(m)) if (value instanceof THREE.Texture) textures.add(value)
      m.dispose()
    }
  })
  textures.forEach(texture => texture.dispose())
}
