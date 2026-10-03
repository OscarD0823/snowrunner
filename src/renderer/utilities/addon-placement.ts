import { Vector3 } from 'three'

/** Both socket offsets use the FBX origin, not the attaching bone's origin. */
export function addonPlacement(truckOffset?: string, addonOffset?: string) {
  const vector = (source?: string) => {
    const values = source?.match(/[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?/gi)?.map(Number) ?? [0, 0, 0]
    if (values.length !== 3 || values.some(n => !Number.isFinite(n))) throw new Error('Invalid addon socket offset')
    return new Vector3(values[0], values[1], values[2])
  }
  return vector(truckOffset).sub(vector(addonOffset))
}
