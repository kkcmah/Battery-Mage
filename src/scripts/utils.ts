import { ExtendedObject3D, Scene3D } from '@enable3d/phaser-extension'
import { PLAYERREF } from './constants'

// get random between min and max [min, max)
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
export const getRandomBetween = (min: number, max: number): number => {
  return Math.random() * (max - min) + min
}

export const disposeMesh = (scene: Scene3D, meshToDispose: ExtendedObject3D) => {
  //https://discourse.threejs.org/t/correctly-remove-mesh-from-scene-and-dispose-material-and-geometry/5448/2
  meshToDispose.geometry.dispose()
  //@ts-ignore
  meshToDispose.material.dispose()
  scene.third.scene.remove(meshToDispose)
  scene.third.renderer.renderLists.dispose()
}

// given corner coords of square check if player's mid position intersects
export const checkCollisionWithPlayer = (xRange: number[], zRange: number[]): boolean => {
  let playerXYZ = PLAYERREF.player?.position
  if (
    playerXYZ &&
    xRange[0] <= playerXYZ.x &&
    playerXYZ.x <= xRange[1] &&
    zRange[0] <= playerXYZ.z &&
    playerXYZ.z <= zRange[1]
  ) {
    return true
  }
  return false
}
