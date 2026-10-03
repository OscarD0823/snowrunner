import { Group, Mesh, type Object3D } from 'three'

/** A single-front mesh is also used on rear axles; filter only actual pairs. */
export function selectWheelVariant(model: Object3D, rear: boolean) {
  model.traverse(group => {
    if (!(group instanceof Group)) return
    const parts = group.children.filter(child=>child instanceof Mesh)
    if (!parts.some(part=>/front/i.test(part.name)) || !parts.some(part=>/rear|back/i.test(part.name))) return
    for (const part of parts) {
      if (/rear|back/i.test(part.name)) part.visible = rear
      else if (/front/i.test(part.name)) part.visible = !rear
    }
  })
}
