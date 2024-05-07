import { ExtendedObject3D, Scene3D, THREE } from '@enable3d/phaser-extension'

import { PLAYERREF, WeaponData, ZAP } from './constants'

export default class Weapon {
  scene: Scene3D
  weaponData: WeaponData
  emitZone: ExtendedObject3D
  weapon: ExtendedObject3D
  onCooldown: boolean = false
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

  updateCooldown(newCooldown: boolean) {
    this.onCooldown = newCooldown
  }

  recoilPlayer() {
    if (this.weaponData.recoil > 0) PLAYERREF.player?.recoilFromWeapon(this.weaponData.recoil)
  }

  useWeapon() {
    if (this.onCooldown) return
    this.onCooldown = true
    PLAYERREF.player?.goOnCooldown(this.weaponData.name)
    this.recoilPlayer()

    const raycaster = new THREE.Raycaster()
    let emitPos = new THREE.Vector3()
    let pos = new THREE.Vector3()
    raycaster.setFromCamera({ x: 0, y: 0 }, this.scene.third.camera)
    // get shooting position to start from wand emit zone
    this.emitZone.getWorldPosition(emitPos)
    pos.copy(raycaster.ray.direction)
    pos.add(emitPos)

    for (let i = 0; i < this.weaponData.shotNum; i++) {
      const mageZap = this.scene.third.physics.add.sphere({
        radius: 0.22,
        x: pos.x,
        y: pos.y,
        z: pos.z,
        mass: 1
      })
      mageZap.visible = false
      mageZap.userData.name = ZAP
      mageZap.userData.damage = this.weaponData.damage
      mageZap.userData.hitMonster = false
      // clamp motion to sweep a bit smaller than physics body radius
      mageZap.body.setCcdMotionThreshold(1)
      mageZap.body.setCcdSweptSphereRadius(0.005)
      mageZap.body.setGravity(0, -1, 0)
      mageZap.body.setFriction(10)

      // add zap image to physics body
      const zapImgToUse = this.weaponData.zapImg[Math.floor(Math.random() * this.weaponData.zapImg.length)]
      const zapImg = this.scene.add.image(-100, -100, zapImgToUse)
      let distance = this.scene.third.camera.position.distanceTo(mageZap.position)
      zapImg.setData('initialDistance', distance)

      // using tween as a way to update img
      this.scene.tweens.add({
        targets: zapImg,
        duration: this.weaponData.duration,
        useFrames: true,
        angle: 1800,
        onUpdate: () => {
          // adjust the size of the img
          let distance = this.scene.third.camera.position.distanceTo(mageZap.position)
          let size = zapImg.getData('initialDistance') / distance
          zapImg.setScale(size)

          // adjust position of the img
          let pos = this.scene.third.transform.from3dto2d(mageZap.position)
          zapImg.setPosition(pos.x, pos.y)
        },
        onComplete: () => {
          this.scene.third.destroy(mageZap)
          zapImg.destroy()
        }
      })

      let posForce = new THREE.Vector3()
      posForce.copy(raycaster.ray.direction)
      posForce.multiplyScalar(this.weaponData.force)

      let forceX = posForce.x * this.weaponData.force
      let forceY = posForce.y * this.weaponData.force
      let forceZ = posForce.z * this.weaponData.force

      if (this.weaponData.spread) {
        forceX *= Math.random() * 20
        forceY *= Math.random() * 20
        forceZ *= Math.random() * 20
      }

      setTimeout(() => {
        mageZap.body.applyForce(forceX, forceY, forceZ)
      }, 2)
    }
  }
}
