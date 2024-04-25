// import { ExtendedObject3D, Scene3D, THREE } from '@enable3d/phaser-extension'
// import { COIN, GROUNDTWEENDUR, PLAYERREF } from './constants'

// export enum ItemTypes {
//   EXP,
//   Coin
// }

// const RADIUSCOIN = 0.2

// export default class Item {
//   scene: Scene3D
//   itemObj3D: ExtendedObject3D
//   itemType: ItemTypes
//   emitPos: THREE.Vector3
//   emitForce: THREE.Vector3
//   emitAngularVel: THREE.Vector3
//   constructor(
//     scene: Scene3D,
//     itemType: ItemTypes,
//     emitPos: THREE.Vector3,
//     emitForce?: THREE.Vector3,
//     emitAngularVel?: THREE.Vector3
//   ) {
//     this.scene = scene
//     this.itemType = itemType
//     this.emitPos = emitPos
//     this.emitForce = emitForce ? emitForce : new THREE.Vector3(0, 0, 0)
//     this.emitAngularVel = emitAngularVel ? emitAngularVel : new THREE.Vector3(0, 0, 0)

//     if (itemType === ItemTypes.Coin) {
//       this.constructCoin()
//     } else if (itemType === ItemTypes.EXP) {
//       this.constructEXP()
//     }
//     this.itemObj3D.userData.isCollected = false
//     this.slowlyFadeAway()
//   }

//   constructCoin() {
//     this.itemObj3D = this.scene.third.add.cylinder(
//       {
//         x: this.emitPos.x,
//         y: this.emitPos.y,
//         z: this.emitPos.z,
//         radiusBottom: RADIUSCOIN,
//         radiusTop: RADIUSCOIN,
//         height: 0.1
//       },
//       { phong: { color: 'gold', transparent: true, opacity: 1 } }
//     )

//     // this.itemObj3D.body.applyForce(this.emitForce.x, this.emitForce.y, this.emitForce.z)
//     // this.itemObj3D.body.setAngularVelocity(this.emitAngularVel.x, this.emitAngularVel.y, this.emitAngularVel.z)
//     this.itemObj3D.name = COIN
//   }

//   // TODO
//   constructEXP() {}

//   // keeping this here to remind me of my failure
//   // slowlyFadeAwayPhysicsBreak() {
//   //   const duration = 100
//   //   const durationReciprocal = 1 / duration

//   //   // const ddd = () => {this.scene.third.destroy(this.itemObj3D)}

//   //   // let intID = setInterval(() => {
//   //   //   if (this.itemObj3D.userData.isCollected) {
//   //   //     console.log('here')
//   //   //     this.itemObj3D.body.setCollisionFlags(4)
//   //   //     this.itemObj3D.visible = false
//   //   //     console.log(this.itemObj3D)
//   //   //     this.scene.third.destroy(this.itemObj3D)
//   //   //     clearInterval(intID)
//   //   //     return
//   //   //     //@ts-ignore
//   //   //   } else if (this.itemObj3D.material.opacity <= 0) {
//   //   //     console.log('opactiy')
//   //   //     this.itemObj3D.body.setCollisionFlags(4)
//   //   //     this.itemObj3D.visible = false
//   //   //     clearInterval(intID)
//   //   //     return
//   //   //   } else {
//   //   //     //@ts-ignore
//   //   //     this.itemObj3D.material.opacity -= durationReciprocal // 1 / duration
//   //   //     this.itemObj3D.body.needUpdate = true
//   //   //   }
//   //   // })

//   //   // this.scene.third.physics.collisionEvents.on('collision', (data) => {
//   //   //   const { bodies, event } = data
//   //   //   console.log(bodies[0].name, bodies[1].name, event)
//   //   // })

//   //   const thisTween = this.scene.tweens.add({
//   //     // target whatever
//   //     targets: this.emitPos,
//   //     duration: duration,
//   //     scale: 1,
//   //     useFrames: true,
//   //     onUpdate: () => {
//   //       // if (!this.itemObj3D.body) {
//   //       //     this.scene.third.destroy(this.itemObj3D)
//   //       //   console.log('o no')
//   //       // }
//   //       if (this.itemObj3D.userData.isCollected) {
//   //         // this.itemObj3D.body.setCollisionFlags(6)
//   //         // //@ts-ignore
//   //         this.itemObj3D.visible = false
//   //         // this.itemObj3D.body.needUpdate = true
//   //         return
//   //       }
//   //       //@ts-ignore
//   //       this.itemObj3D.material.opacity -= durationReciprocal // 1 / duration
//   //       // this.itemObj3D.body.needUpdate = true
//   //       if (this.itemObj3D.userData.isCollected) console.log('made it here')
//   //     },
//   //     onComplete: () => {
//   //       // this.itemObj3D.body.setCollisionFlags(6)
//   //       // //@ts-ignore
//   //       this.itemObj3D.visible = false
//   //       // this.scene.third.destroy(this.itemObj3D)
//   //     }
//   //   })
//   // }

//   slowlyFadeAway() {
//     const duration = 200
//     const durationReciprocal = 1 / duration
//     const repeat = 8

//     let tmp = this.itemObj3D.position.clone()
//     let xRange = [tmp.x - RADIUSCOIN, tmp.x + RADIUSCOIN]
//     let zRange = [tmp.z - RADIUSCOIN, tmp.z + RADIUSCOIN]
//     console.log(xRange)
//     console.log(zRange)
//     console.log(PLAYERREF.player?.position)
//     const tweenAfter: Phaser.Types.Tweens.TweenBuilderConfig = {
//       targets: tmp,
//       ease: 'sine.inout',
//       duration: duration / repeat / 2,
//       //@ts-ignore
//       y: '+=1',
//       useFrames: true,
//       repeat: repeat,
//       yoyo: true,
//       onUpdate: () => {
//         this.itemObj3D.position.set(tmp.x, tmp.y, tmp.z)
//         this.itemObj3D.rotateZ(0.4)
//         this.itemObj3D.rotateY(0.2)
//         //@ts-ignore
//         this.itemObj3D.material.opacity -= durationReciprocal // 1 / duration
//       },
//       onComplete: () => {
//         //https://discourse.threejs.org/t/correctly-remove-mesh-from-scene-and-dispose-material-and-geometry/5448/2
//         this.itemObj3D.geometry.dispose()
//         //@ts-ignore
//         this.itemObj3D.material.dispose()
//         this.scene.third.scene.remove(this.itemObj3D)
//         this.scene.third.renderer.renderLists.dispose()
//       }
//     }

//     this.scene.tweens.add({
//       targets: tmp,
//       ease: 'sine.inout',
//       duration: GROUNDTWEENDUR,
//       y: '+=2',
//       useFrames: false,
//       yoyo: true,
//       onUpdate: () => {
//         this.itemObj3D.position.set(tmp.x, tmp.y, tmp.z)
//         this.itemObj3D.rotateZ(0.2)
//         this.itemObj3D.rotateY(0.2)
//         // //@ts-ignore
//         // this.itemObj3D.material.opacity -= durationReciprocal // 1 / duration
//       },
//       onComplete: () => {
//         this.scene.tweens.add(tweenAfter)
//         // //https://discourse.threejs.org/t/correctly-remove-mesh-from-scene-and-dispose-material-and-geometry/5448/2
//         // this.itemObj3D.geometry.dispose()
//         // //@ts-ignore
//         // this.itemObj3D.material.dispose()
//         // this.scene.third.scene.remove(this.itemObj3D)
//         // this.scene.third.renderer.renderLists.dispose()
//       }
//     })
//   }
// }
