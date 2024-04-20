import { ExtendedObject3D, Scene3D, THREE } from '@enable3d/phaser-extension'

import { ZAP } from './constants'

export interface WeaponData {
  damage: number
  cooldown: number
  range: number
  spread: number
  shotNum: number
  force: number
  isUnlocked: boolean
}

export default class Weapon {
  scene: Scene3D
  weaponData: WeaponData
  emitZone: ExtendedObject3D
  weapon: ExtendedObject3D
  constructor(scene: Scene3D, weaponData: WeaponData, emitZone: ExtendedObject3D) {
    this.scene = scene
    this.weaponData = weaponData
    this.emitZone = emitZone
    emitZone.visible = false
    if (emitZone.parent) {
      this.weapon = emitZone.parent
      this.weapon.visible = false
    }
  }

  canSwapTo() {
    return this.weaponData.isUnlocked
  }

  useWeapon() {
    const raycaster = new THREE.Raycaster()
    let emitPos = new THREE.Vector3()
    let pos = new THREE.Vector3()
    raycaster.setFromCamera({ x: 0, y: 0 }, this.scene.third.camera)
    // get shooting position to start from wand emit zone
    this.emitZone.getWorldPosition(emitPos)
    pos.copy(raycaster.ray.direction)
    pos.add(emitPos)

    const mageZap = this.scene.third.physics.add.sphere({ radius: 0.1, x: pos.x, y: pos.y, z: pos.z, mass: 1 })
    mageZap.visible = false
    mageZap.name = ZAP

    // add zap image to physics body
    const zapImg = this.scene.add.image(-100, -100, 'zap')
    let distance = this.scene.third.camera.position.distanceTo(mageZap.position)
    zapImg.setData('initialDistance', distance)

    // using tween as a way to update img
    this.scene.tweens.add({
      targets: zapImg,
      // TODO limit range of projectiles
      duration: 200,
      scale: 1,
      onUpdate: () => {
        // adjust the size of the img
        let distance = this.scene.third.camera.position.distanceTo(mageZap.position)
        let size = zapImg.getData('initialDistance') / distance
        zapImg.setScale(size)

        // adjust position of the img
        let pos = this.scene.third.transform.from3dto2d(mageZap.position)
        zapImg.setPosition(pos.x, pos.y)

        zapImg.setAngle(pos.y)
      },
      onComplete: () => {
        this.scene.third.destroy(mageZap)
        zapImg.destroy()
      }
    })

    pos.copy(raycaster.ray.direction)
    pos.multiplyScalar(this.weaponData.force)

    let forceX = pos.x * this.weaponData.force * Math.random() * 20
    let forceY = pos.y * this.weaponData.force * Math.random() * 20
    let forceZ = pos.z * this.weaponData.force * Math.random() * 20

    mageZap.body.applyForce(forceX, forceY, forceZ)
  }
}
