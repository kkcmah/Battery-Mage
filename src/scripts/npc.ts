import { ExtendedObject3D, Scene3D, THREE } from '@enable3d/phaser-extension'

export default class Npc extends ExtendedObject3D {
  scene: Scene3D
  constructor(scene: Scene3D) {
    super()
    this.scene = scene
  }
}
