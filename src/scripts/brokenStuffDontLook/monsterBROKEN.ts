// import { ExtendedObject3D, Scene3D, THREE } from '@enable3d/phaser-extension'
// import { HPCOLOR, MONSTEROUTOFBOUNDSY, OUTOFBOUNDSY, PIMINUSROTDIFF, PLAYERREF, ROTDIFF } from './constants'

// export enum MonsterTypes {
//   WaterDrop,
//   Soap,
//   Plate,
//   GloveL,
//   GloveR
// }

// enum MonsterStates {
//   Idle,
//   DetectsPlayer
// }
// export default class Monster {
//   scene: Scene3D
//   monsterType: MonsterTypes
//   spawnPos: THREE.Vector3
//   monsterObj3D: ExtendedObject3D
//   damage: number
//   currentHP: number
//   maxHP: number
//   respawnTime: number
//   expAmount: number
//   coinAmount: number
//   speed: number = 5
//   canJump: boolean = true
//   constructor(scene: Scene3D, monsterType: MonsterTypes, spawnPos: THREE.Vector3, monsterObj3D: ExtendedObject3D) {
//     this.scene = scene
//     this.monsterType = monsterType
//     this.monsterObj3D = monsterObj3D.clone()
//     this.spawnPos = spawnPos

//     this.scene.third.add.existing(this.monsterObj3D)
//     // this.scene.third.physics.add.existing(this.monsterObj3D, {
//     //   shape: 'box',
//     //   // offset: { y: -0.55 },
//     //   height: 1,
//     //   mass: 100
//     // })
    

//     const hpBar = this.scene.third.add.box(
//       { width: 1.2, height: 0.1, depth: 0.1, y: 0.8 },
//       { lambert: { color: HPCOLOR } }
//     )
//     this.monsterObj3D.add(hpBar)

//     // add a sensor for feet
//     const sensorFeet = new ExtendedObject3D()
//     // sensorFeet.position.setY(-0.5)
//     sensorFeet.position.set(this.spawnPos.x - 1, this.spawnPos.y - 2.5, this.spawnPos.z - 1)
//     this.scene.third.physics.add.existing(sensorFeet, {
//       mass: 1e-8,
//       shape: 'box',
//       width: 0.2,
//       height: 0.1,
//       depth: 0.2
//     })
//     sensorFeet.body.setCollisionFlags(4)

//     // connect sensor to monster
//     // this.scene.third.physics.add.constraints.lock(this.monsterObj3D.body, sensorFeet.body)

//     // detect if sensor is on the ground
//     sensorFeet.body.on.collision((otherObject, event) => {
//       if (otherObject.userData.isGround) {
//         if (event !== 'end') this.canJump = true
//         else this.canJump = false
//       }
//     })

//     // add a sensor for detecting player
//     const sensorDetection = new ExtendedObject3D()
//     sensorDetection.position.set(this.spawnPos.x - 1, this.spawnPos.y - 2, this.spawnPos.z - 1)
//     this.scene.third.physics.add.existing(sensorDetection, {
//       mass: 1e-8,
//       shape: 'box',
//       width: 50,
//       height: 2,
//       depth: 50
//     })
//     sensorDetection.body.setCollisionFlags(4)

//     // connect sensor to monster
//     // this.scene.third.physics.add.constraints.lock(this.monsterObj3D.body, sensorDetection.body)
//     this.scene.third.physics.add.constraints.lock(sensorFeet.body, sensorDetection.body)

//     // detect if sensor is on the ground
//     sensorDetection.body.on.collision((otherObject, event) => {
//       if (event === 'end' && otherObject.name === 'mage') {
//         // TODO
//         console.log('detechs mage')
//       }
//     })

//     this.monsterObj3D.position.set(spawnPos.x, spawnPos.y, spawnPos.z)
//     this.scene.third.physics.add.existing(this.monsterObj3D, {
//       shape: 'box',
//       // offset: { y: -0.55 },
//       height: 1,
//       mass: 100
//     })
//     this.scene.third.physics.add.constraints.lock(this.monsterObj3D.body, sensorFeet.body)

//     this.scene.third.physics.add.constraints.lock(this.monsterObj3D.body, sensorDetection.body)
//     // this.monsterObj3D.body.setDamping(0.9, 0.9)
//     this.monsterObj3D.body.setAngularFactor(0, 0, 0)
//     // this.monsterObj3D.body.setGravity(0, 0, 0)
//     // this.monsterObj3D.body.setFriction(0.9)
//     // this.monsterObj3D.body.setBounciness(1)
//     // setInterval(() => {
//     //   this.moveToSpawn()
//     //   // hpBar.scale.multiply(new THREE.Vector3(0.9, 1, 1))
//     // }, 1000)
//   }

//   moveToSpawn() {
//     const monsterPos = new THREE.Vector3()
//     const dirMonster = new THREE.Vector3()

//     this.monsterObj3D.getWorldPosition(monsterPos)
//     // this.monsterObj3D.body.setVelocityY(5)

//     // TODO cant climb up if pos < spawn -
//     if (monsterPos.distanceTo(this.spawnPos) > 5) {
//       dirMonster.subVectors(this.spawnPos, monsterPos)
//       dirMonster.normalize()
//       this.monsterObj3D.body.setVelocity(
//         dirMonster.x * this.speed,
//         dirMonster.y * this.speed,
//         dirMonster.z * this.speed
//       )
//     }
//   }

//   // TODO
//   moveTowardsPlayer() {
//     if (!PLAYERREF.player) return
//     const dirMonster = new THREE.Vector3()
//     const monsterPos = new THREE.Vector3()
//     const playerPos = new THREE.Vector3()

//     this.monsterObj3D.getWorldPosition(monsterPos)
//     PLAYERREF.player.getWorldPosition(playerPos)
//     dirMonster.subVectors(playerPos, monsterPos)
//     this.monsterObj3D.body.setVelocity(dirMonster.x * this.speed, dirMonster.y * this.speed, dirMonster.z * this.speed)
//   }

//   moveForwards() {
//     const curMonsterDirection = new THREE.Vector3()
//     this.monsterObj3D.getWorldDirection(curMonsterDirection)
//     this.monsterObj3D.body.setVelocity(curMonsterDirection.x * this.speed, 0, curMonsterDirection.z * this.speed)
//   }

//   rotateTowardsPlayer() {
//     if (!PLAYERREF.player) return
//     const playerPos = new THREE.Vector3()
//     const monsterPos = new THREE.Vector3()
//     const dirMonster = new THREE.Vector3()
//     const curMonsterDirection = new THREE.Vector3()

//     this.monsterObj3D.getWorldPosition(monsterPos)
//     PLAYERREF.player.getWorldPosition(playerPos)
//     dirMonster.subVectors(playerPos, monsterPos)
//     const theta = Math.atan2(dirMonster.x, dirMonster.z)
//     this.monsterObj3D.getWorldDirection(curMonsterDirection)
//     const thetaMonster = Math.atan2(curMonsterDirection.x, curMonsterDirection.z)
//     this.monsterObj3D.body.setAngularVelocityY(0)

//     const l = Math.abs(theta - thetaMonster)
//     let rotationSpeed = 5

//     if (l > ROTDIFF) {
//       if (l > PIMINUSROTDIFF) rotationSpeed *= -1
//       if (theta < thetaMonster) rotationSpeed *= -1
//       this.monsterObj3D.body.setAngularVelocityY(rotationSpeed)
//     }
//   }

//   respawn() {
//     // set body to be kinematic
//     this.monsterObj3D.body.setCollisionFlags(2)

//     // set the new position
//     this.monsterObj3D.rotation.set(0, 0, 0)
//     this.monsterObj3D.position.set(this.spawnPos.x, this.spawnPos.y, this.spawnPos.z)
//     this.monsterObj3D.body.needUpdate = true

//     // this will run only on the next update if body.needUpdate = true
//     this.monsterObj3D.body.once.update(() => {
//       // set body back to dynamic
//       this.monsterObj3D.body.setCollisionFlags(0)

//       // if you do not reset the velocity and angularVelocity, the object will keep it
//       this.monsterObj3D.body.setVelocity(0, 0, 0)
//       this.monsterObj3D.body.setAngularVelocity(0, 0, 0)
//     })
//   }

//   // called by mainscene's update
//   update(time: number, delta: number) {
//     // this.moveTowardsPlayer()
//     this.rotateTowardsPlayer()
//     if (this.monsterObj3D.position.y < MONSTEROUTOFBOUNDSY) {
//       this.respawn()
//     }
//   }
// }
