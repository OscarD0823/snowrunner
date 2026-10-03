import { Matrix4, Quaternion, Vector3 } from 'three'

/** Farming wheels may be authored in a folding arm's local coordinate frame. */
export function wheelPlacement(position: [number, number, number], right: boolean, localFrame?: number[]) {
  const point = new Vector3(...position)
  if (right) point.z *= -1
  let orientation: Quaternion | undefined
  if (localFrame) {
    const matrix = new Matrix4().fromArray(localFrame)
    point.applyMatrix4(matrix)
    orientation = new Quaternion().setFromRotationMatrix(new Matrix4().extractRotation(matrix))
  }
  return { position: point.toArray() as [number, number, number], orientation }
}
