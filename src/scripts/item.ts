import { ExtendedObject3D, Scene3D, THREE } from '@enable3d/phaser-extension'
import { COIN, GROUNDTWEENDUR, PLAYERREF } from './constants'
import { checkCollisionWithPlayer, disposeMesh } from './utils'

export enum ItemTypes {
  EXP,
  Coin
}

const RADIUSCOIN = 0.2

export default class Item {
  scene: Scene3D
  itemObj3D: ExtendedObject3D
  itemType: ItemTypes
  emitPos: THREE.Vector3
  constructor(scene: Scene3D, itemType: ItemTypes, emitPos: THREE.Vector3) {
    this.scene = scene
    this.itemType = itemType
    this.emitPos = emitPos

    if (itemType === ItemTypes.Coin) {
      this.constructCoin()
      this.slowlyFadeAway(RADIUSCOIN)
    } else if (itemType === ItemTypes.EXP) {
      this.constructEXP()
    }
  }

  constructCoin() {
    this.itemObj3D = this.scene.third.add.cylinder(
      {
        x: this.emitPos.x,
        y: this.emitPos.y,
        z: this.emitPos.z,
        radiusBottom: RADIUSCOIN,
        radiusTop: RADIUSCOIN,
        height: 0.1
      },
      { phong: { color: 'gold', transparent: true, opacity: 1 } }
    )

    this.itemObj3D.name = COIN
  }

  // TODO
  constructEXP() {}

  slowlyFadeAway(collideRadius: number) {
    const duration = 200
    const durationReciprocal = 1 / duration
    const repeat = 8

    let tweenAfterRef: Phaser.Tweens.Tween | undefined
    let collected = false

    let tmp = this.itemObj3D.position.clone()

    // making coin hitbox a bit bigger
    let collideHitBox = collideRadius * 2
    const xRange = [tmp.x - collideHitBox, tmp.x + collideHitBox]
    const zRange = [tmp.z - collideHitBox, tmp.z + collideHitBox]

    const tweenAfter: Phaser.Types.Tweens.TweenBuilderConfig = {
      targets: tmp,
      ease: 'sine.inout',
      duration: duration / repeat / 2,
      //@ts-ignore
      y: '+=1',
      useFrames: true,
      repeat: repeat,
      yoyo: true,
      onUpdate: () => {
        if (!collected && checkCollisionWithPlayer(xRange, zRange)) {
          disposeMesh(this.scene, this.itemObj3D)
          tweenAfterRef?.remove()
          tweenAfterRef = undefined
          collected = true
          PLAYERREF.player?.pickUp(this.itemType)
          return
        } else {
          this.itemObj3D.position.set(tmp.x, tmp.y, tmp.z)
          this.itemObj3D.rotateZ(0.4)
          this.itemObj3D.rotateY(0.2)
          //@ts-ignore
          this.itemObj3D.material.opacity -= durationReciprocal // 1 / duration
        }
      },
      onComplete: () => {
        disposeMesh(this.scene, this.itemObj3D)
      }
    }

    this.scene.tweens.add({
      targets: tmp,
      ease: 'sine.inout',
      duration: GROUNDTWEENDUR * 0.8,
      y: '+=2',
      useFrames: false,
      yoyo: true,
      onUpdate: () => {
        this.itemObj3D.position.set(tmp.x, tmp.y, tmp.z)
        this.itemObj3D.rotateZ(0.2)
        this.itemObj3D.rotateY(0.2)
      },
      onComplete: () => {
        tweenAfterRef = this.scene.tweens.add(tweenAfter)
      }
    })
  }
}
