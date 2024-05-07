import { ExtendedObject3D, Scene3D, THREE } from '@enable3d/phaser-extension'
import { COIN, EXP, GROUNDTWEENDUR, PLAYERREF } from './constants'
import { checkCollisionWithPlayer, disposeMesh, getRandomBetween } from './utils'

export enum ItemTypes {
  EXP,
  Coin
}

const RADIUSCOIN = 0.2
const RADIUSEXP = 0.15

export default class Item {
  scene: Scene3D
  itemObj3D: ExtendedObject3D
  itemType: ItemTypes
  emitPos: THREE.Vector3
  flyTowardsPlayer: boolean

  constructor(scene: Scene3D, itemType: ItemTypes, emitPos: THREE.Vector3, flyTowardsPlayer: boolean = false) {
    this.scene = scene
    this.itemType = itemType
    this.emitPos = emitPos
    this.flyTowardsPlayer = flyTowardsPlayer

    if (itemType === ItemTypes.Coin) {
      this.constructCoin()
      if (this.flyTowardsPlayer) {
        this.flyTowardsAndAutoCollect()
      } else {
        this.slowlyFadeAway(RADIUSCOIN)
      }
    } else if (itemType === ItemTypes.EXP) {
      this.constructEXP()
      if (this.flyTowardsPlayer) {
        this.flyTowardsAndAutoCollect()
      } else {
        this.slowlyFadeAway(RADIUSEXP)
      }
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

    this.itemObj3D.userData.name = COIN
  }

  constructEXP() {
    const randomFactor = getRandomBetween(0.7, 1)
    this.itemObj3D = this.scene.third.add.sphere(
      {
        x: this.emitPos.x,
        y: this.emitPos.y,
        z: this.emitPos.z,
        radius: RADIUSEXP * randomFactor * 1.1
      },
      { phong: { color: 'green', transparent: true, wireframe: true } }
    )

    const inner = this.scene.third.add.sphere(
      {
        radius: RADIUSEXP * randomFactor * 0.7
      },
      { phong: { color: 'yellow', transparent: true } }
    )

    this.itemObj3D.add(inner)

    this.itemObj3D.userData.name = EXP
  }

  flyTowardsAndAutoCollect() {
    if (!PLAYERREF.player) return
    const duration = 300
    let tweenAfterRef: Phaser.Tweens.Tween | undefined

    let tmp = this.itemObj3D.position.clone()

    const tweenAfter: Phaser.Types.Tweens.TweenBuilderConfig = {
      targets: tmp,
      ease: 'sine.inout',
      duration: duration,
      //@ts-ignore
      x: PLAYERREF.player?.position.x,
      y: PLAYERREF.player?.position.y - 1,
      z: PLAYERREF.player?.position.z,
      onUpdate: () => {
        this.itemObj3D.position.set(tmp.x, tmp.y, tmp.z)
        this.itemObj3D.rotateZ(0.4)
        this.itemObj3D.rotateY(0.2)
      },
      onComplete: () => {
        tweenAfterRef?.remove()
        tweenAfterRef = undefined
        PLAYERREF.player?.pickUp(this.itemType)
        disposeMesh(this.scene, this.itemObj3D)
      }
    }

    this.scene.tweens.add({
      targets: tmp,
      ease: 'sine.inout',
      duration: 400,
      y: '+=2',
      useFrames: false,
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

  slowlyFadeAway(collideRadius: number) {
    const duration = 300
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
          this.itemObj3D.children.forEach((child) => {
            //@ts-ignore
            child.material.opacity -= durationReciprocal
          })
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
