import { ExtendedObject3D, Scene3D } from '@enable3d/phaser-extension'

import { INACTIVEWEPSCALE3DUI } from './constants'

export default class UI3DObj {
  scene: Scene3D
  rect: Phaser.GameObjects.Rectangle
  uI3DObj: ExtendedObject3D
  x: number
  y: number
  // distance from cam
  z: number = 2.1
  constructor(
    scene: Scene3D,
    rect: Phaser.GameObjects.Rectangle,
    preLoaded3DObj: ExtendedObject3D,
    visible: boolean = false
  ) {
    this.scene = scene
    this.rect = rect
    this.uI3DObj = preLoaded3DObj.clone(true)
    this.uI3DObj.visible = visible
    // normalize values
    this.x = (this.rect.x / this.scene.scale.width) * 2 - 1
    this.y = -(this.rect.y / this.scene.scale.height) * 2 + 1
    this.uI3DObj.scale.setScalar(INACTIVEWEPSCALE3DUI)
    this.scene.third.add.existing(this.uI3DObj)
  }

  setVisibility(newVis: boolean) {
    this.uI3DObj.visible = newVis
  }

  setScale(newScale: number) {
    this.uI3DObj.scale.setScalar(newScale)
  }

  update(time: number, delta: number) {
    const position = this.scene.third.transform.from2dto3d(this.x, this.y, this.z)
    if (position) {
      const { x, y, z } = position
      this.uI3DObj.position.set(x, y, z)
      this.uI3DObj.rotateX(0.05)
      this.uI3DObj.rotateY(0.05)
    }
  }
}
