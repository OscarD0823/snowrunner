import * as THREE from 'three'

/** Ignore hidden wheel variants and helper geometry when framing the vehicle. */
export function visibleVehicleBounds(object: THREE.Object3D) {
  object.updateWorldMatrix(true, true)
  const box = new THREE.Box3()
  object.traverseVisible(child => {
    if (!(child instanceof THREE.Mesh)) return
    child.geometry.computeBoundingBox()
    if (child.geometry.boundingBox) box.union(child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld))
  })
  return box
}

/** Fit all eight corners, including depth, to both horizontal and vertical FOV. */
export function fitVehicleCamera(camera: THREE.PerspectiveCamera, box: THREE.Box3, direction = new THREE.Vector3(.75, .35, 1.4)) {
  if (box.isEmpty()) return new THREE.Vector3()
  const center = box.getCenter(new THREE.Vector3()), forward = direction.clone().normalize()
  const right = new THREE.Vector3().crossVectors(camera.up, forward).normalize()
  const up = new THREE.Vector3().crossVectors(forward, right)
  const tanY = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), tanX = tanY * camera.aspect
  let distance = 1
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
    const p = new THREE.Vector3(x, y, z).sub(center)
    distance = Math.max(distance, p.dot(forward) + Math.max(Math.abs(p.dot(right)) / tanX, Math.abs(p.dot(up)) / tanY) * 1.18)
  }
  camera.position.copy(center).addScaledVector(forward, distance)
  camera.near = Math.max(.02, distance / 1000); camera.far = Math.max(250, distance * 5)
  camera.lookAt(center); camera.updateProjectionMatrix(); camera.updateMatrixWorld()
  return center
}
