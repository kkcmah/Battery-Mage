import { ExtendedObject3D, Scene3D, THREE } from '@enable3d/phaser-extension'
import {
  HPCOLOR,
  MAGE,
  MONSTEROUTOFBOUNDSY,
  PIMINUSROTDIFF,
  PLAYERREF,
  PLAYERRESPAWNTIME,
  ROTDIFF,
  ZAP
} from './constants'
import { checkCollisionWithPlayer, getRandomBetween } from './utils'
import Item, { ItemTypes } from './item'
import { MonsterData } from './monsterData'

export enum MonsterTypes {
  Knight,
  Bishop,
  Rook,
  Boss
}

export enum MonsterStates {
  Idle,
  BossIdle,
  DetectsPlayer,
  ReturningToSpawn,
  Dead
}
export default class Monster {
  scene: Scene3D
  monsterType: MonsterTypes
  spawnPos: THREE.Vector3
  monsterObj3D: ExtendedObject3D
  damage: number = 5
  currentHP: number = 100
  maxHP: number = 100
  respawnTime: number = 1000
  expAmount: number = 2
  coinAmount: number = 2
  speed: number = 1.5 // 1.5 seems like sweet spot to move backwards and shoot
  canJump: boolean = false // initial jump state when spawned in doesn't mean cant ever jump
  jumpCooldown: number = 2000
  prevJumpTime: number = 0
  currentState: MonsterStates = MonsterStates.Idle
  prevDmgTime: number = 0
  dmgCooldown: number = 200 // per monster iframes on player
  specialCooldown: number = 6000
  prevSpecialTime: number = 0
  prevProjectileTime: number = 0
  projectileCooldown: number = 3000
  xRange: number[] | undefined
  zRange: number[] | undefined
  hpBar: ExtendedObject3D // this is made here
  tpingAway: boolean = false // only used by boss
  lockedPlayerIn: boolean = false // boss
  castleDoor: ExtendedObject3D // boss
  constructor(
    scene: Scene3D,
    monsterType: MonsterTypes,
    spawnPos: THREE.Vector3,
    monsterObj3D: ExtendedObject3D,
    monsterData: MonsterData
  ) {
    this.scene = scene
    this.monsterType = monsterType
    this.monsterObj3D = new ExtendedObject3D()
    this.copyIncomingMonsterData(monsterData)

    const clone = monsterObj3D.clone(true)
    clone.position.set(0, 0, 0)
    this.monsterObj3D.add(clone)
    const r = Math.floor(getRandomBetween(0, 255))
    const g = Math.floor(getRandomBetween(0, 255))
    const b = Math.floor(getRandomBetween(0, 255))

    this.monsterObj3D.traverse((child) => {
      if (child.material) {
        //@ts-ignore idk how this works but it gives a funky style and im sticking with it
        child.material.color.setRGB(r, g, b)
      }
    })
    this.spawnPos = spawnPos

    if (this.monsterType === MonsterTypes.Boss) {
      this.monsterObj3D.position.set(spawnPos.x, spawnPos.y + 100, spawnPos.z)
    } else {
      this.monsterObj3D.position.set(spawnPos.x, spawnPos.y, spawnPos.z)
    }

    this.scene.third.add.existing(this.monsterObj3D)
    this.scene.third.physics.add.existing(this.monsterObj3D, {
      shape: 'box',
      height: 1.2,
      width: 0.7,
      depth: 0.7,
      mass: 100,
      offset: { y: -0.55 }
    })

    this.monsterObj3D.body.on.collision((otherObject, event) => {
      if (!PLAYERREF.player) return
      // damaging player
      if (otherObject.userData.name === MAGE && this.currentState !== MonsterStates.Dead) {
        this.dealDamage()
      }
      // taking damage from player
      if (this.currentState !== MonsterStates.Dead && otherObject.userData.name === ZAP && !otherObject.userData.hitMonster) {
        this.tookDamage(otherObject.userData.damage * PLAYERREF.player.dmgFactor)
        otherObject.userData.hitMonster = true
      }
    })

    const hpBarWidth = this.monsterType === MonsterTypes.Boss ? 2 : 1.2
    this.hpBar = new ExtendedObject3D()
    this.hpBar = this.scene.third.add.box(
      { width: hpBarWidth, height: 0.1, depth: 0.1, y: 1.3 },
      { lambert: { color: HPCOLOR } }
    )
    this.monsterObj3D.add(this.hpBar)

    const sensorFeet = this.scene.third.add.box({ y: -0.5 })
    sensorFeet.visible = false
    // connect sensor to monster
    this.monsterObj3D.add(sensorFeet)
    this.scene.third.physics.add.existing(sensorFeet, {
      mass: 1e-8,
      shape: 'box',
      width: 0.2,
      height: 0.2,
      depth: 0.2,
      collisionFlags: 4
    })

    // disable collisions between sensorfeet and monster
    this.scene.third.physics.add.constraints.lock(this.monsterObj3D.body, sensorFeet.body)

    // detect if sensor is on the ground
    sensorFeet.body.on.collision((otherObject, event) => {
      if (otherObject.userData.isGround) {
        if (event !== 'end') this.canJump = true
        else this.canJump = false
      }
    })

    this.monsterObj3D.body.setAngularFactor(0, 0, 0)
    if (this.monsterType === MonsterTypes.Boss) {
      this.loadCastleAndDoor()
      this.monsterObj3D.body.setCollisionFlags(2)
    }
    // this.monsterObj3D.body.setGravity(0, 0, 0)
    // this.monsterObj3D.body.setFriction(0.9)
    this.monsterObj3D.body.setBounciness(1)
    this.monsterObj3D.userData.isGround = true

    // TODO uncomment to show boss area
    // if (this.xRange && this.zRange) {
    //   this.scene.third.add.box(
    //     { x: this.xRange[0], y: 2, z: this.zRange[0], height: 10, width: 0.2, depth: 0.2 },
    //     { phong: { color: 'rgb(0,255,0)' } }
    //   )
    //   this.scene.third.add.box(
    //     { x: this.xRange[1], y: 2, z: this.zRange[1], height: 10, width: 0.2, depth: 0.2 },
    //     { phong: { color: 'rgb(255,0,0)' } }
    //   )
    //   this.scene.third.physics.add.box(
    //     {
    //       x: 120,
    //       y: 3,
    //       z: 115.5,
    //       width: 10,
    //       height: 8,
    //       depth: 1
    //     },
    //     {
    //       lambert: { color: 'black' }
    //     }
    //   )
    // }
  }

  copyIncomingMonsterData(monsterData: MonsterData) {
    this.damage = monsterData.damage
    this.maxHP = this.currentHP = monsterData.maxHP
    this.respawnTime = monsterData.respawnTime
    this.expAmount = monsterData.expAmount
    this.coinAmount = monsterData.coinAmount
    this.speed = monsterData.speed
    this.canJump = monsterData.canJump
    this.jumpCooldown = monsterData.jumpCooldown
    this.currentState = monsterData.currentState
    this.prevDmgTime = monsterData.prevDmgTime
    this.dmgCooldown = monsterData.dmgCooldown
    this.specialCooldown = monsterData.specialCooldown
    this.prevSpecialTime = monsterData.prevSpecialTime
    this.prevProjectileTime = monsterData.prevProjectileTime
    this.projectileCooldown = monsterData.projectileCooldown
    this.xRange = monsterData.xRange
    this.zRange = monsterData.zRange
  }

  moveToSpawn() {
    const monsterPos = new THREE.Vector3()
    const dirSpawn = new THREE.Vector3()

    this.monsterObj3D.getWorldPosition(monsterPos)

    if (monsterPos.distanceTo(this.spawnPos) > 5) {
      dirSpawn.subVectors(this.spawnPos, monsterPos)
      dirSpawn.normalize()
      this.monsterObj3D.body.setVelocityX(dirSpawn.x * this.speed)
      this.monsterObj3D.body.setVelocityZ(dirSpawn.z * this.speed)
    } else {
      // returned to spawn
      this.currentState = MonsterStates.Idle
    }
  }

  bossTPAway() {
    this.tpingAway = true
    setTimeout(() => {
      this.monsterObj3D.body.setCollisionFlags(2)

      this.monsterObj3D.rotation.set(0, 0, 0)
      this.monsterObj3D.position.set(this.spawnPos.x, this.spawnPos.y + 100, this.spawnPos.z)
      this.monsterObj3D.body.needUpdate = true
      this.tpingAway = false
      this.openDoor()

      this.monsterObj3D.body.once.update(() => {
        this.currentState = MonsterStates.BossIdle
        this.monsterObj3D.body.setVelocity(0, 0, 0)
        this.monsterObj3D.body.setAngularVelocity(0, 0, 0)
      })
    }, PLAYERRESPAWNTIME * 1.5)
  }

  loadCastleAndDoor() {
    const r = Math.floor(getRandomBetween(0, 255))
    const g = Math.floor(getRandomBetween(0, 255))
    const b = Math.floor(getRandomBetween(0, 255))

    // load castle and door separately
    this.scene.third.load.gltf('assets/glb/Castle.glb').then((object) => {
      const castle = new ExtendedObject3D()
      castle.add(object.scene)
      castle.position.set(130, 0.45, 100)
      castle.rotateY(3.14)
      this.scene.third.add.existing(castle)
      this.scene.third.physics.add.existing(castle, { shape: 'concaveMesh', mass: 0 })

      castle.traverse((child) => {
        if (child.isMesh) {
          //@ts-ignore
          if (child.material) child.material.color.setRGB(r, g, b)
        }
      })
      this.scene.third.animationMixers.add(castle.anims.mixer)
      object.animations.forEach((animation) => {
        if (animation.name) {
          castle.anims.add(animation.name, animation)
        }
      })
      castle.anims.play('draining')
    })

    this.scene.third.load.gltf('assets/glb/Door.glb').then((object) => {
      this.castleDoor = new ExtendedObject3D()
      this.castleDoor.add(object.scene)
      this.castleDoor.position.set(130, 0.45, 100)
      this.castleDoor.rotateY(3.14)
      this.scene.third.add.existing(this.castleDoor)
      this.scene.third.physics.add.existing(this.castleDoor, { shape: 'concaveMesh', mass: 0, collisionFlags: 2 })

      this.castleDoor.traverse((child) => {
        if (child.isMesh) {
          //@ts-ignore
          if (child.material) child.material.color.setRGB(r, g, b)
        }
      })
      this.openDoor()
    })
  }

  lockPlayerIn() {
    if (this.lockedPlayerIn) return
    this.lockedPlayerIn = true
    this.castleDoor.position.set(130, 0.45, 100) // same pos as castle
    this.castleDoor.body.needUpdate = true
    PLAYERREF.player?.bossFight()
  }

  openDoor() {
    this.lockedPlayerIn = false
    this.castleDoor.position.set(10, -20, 10)
    this.castleDoor.body.needUpdate = true
  }

  moveTowardsPlayer() {
    if (!PLAYERREF.player) return
    const dirMonster = new THREE.Vector3()
    const monsterPos = new THREE.Vector3()
    const playerPos = new THREE.Vector3()

    this.monsterObj3D.getWorldPosition(monsterPos)
    PLAYERREF.player.getWorldPosition(playerPos)
    dirMonster.subVectors(playerPos, monsterPos)
    this.monsterObj3D.body.setVelocity(dirMonster.x * this.speed, dirMonster.y * this.speed, dirMonster.z * this.speed)
  }

  moveForwards() {
    const curMonsterDirection = new THREE.Vector3()
    this.monsterObj3D.getWorldDirection(curMonsterDirection)
    this.monsterObj3D.body.setVelocityX(curMonsterDirection.x * this.speed)
    this.monsterObj3D.body.setVelocityZ(curMonsterDirection.z * this.speed)
  }

  rotateTowardsPlayer() {
    if (!PLAYERREF.player) return
    const playerPos = new THREE.Vector3()
    const monsterPos = new THREE.Vector3()
    const dirMonster = new THREE.Vector3()
    const curMonsterDirection = new THREE.Vector3()

    this.monsterObj3D.getWorldPosition(monsterPos)
    PLAYERREF.player.getWorldPosition(playerPos)
    dirMonster.subVectors(playerPos, monsterPos)
    const theta = Math.atan2(dirMonster.x, dirMonster.z)
    this.monsterObj3D.getWorldDirection(curMonsterDirection)
    const thetaMonster = Math.atan2(curMonsterDirection.x, curMonsterDirection.z)
    this.monsterObj3D.body.setAngularVelocityY(0)

    const l = Math.abs(theta - thetaMonster)
    let rotationSpeed = 5

    if (l > ROTDIFF) {
      if (l > PIMINUSROTDIFF) rotationSpeed *= -1
      if (theta < thetaMonster) rotationSpeed *= -1
      this.monsterObj3D.body.setAngularVelocityY(rotationSpeed)
    }
  }

  respawn() {
    // set body to be kinematic
    this.monsterObj3D.body.setCollisionFlags(2)

    // set the new position
    this.monsterObj3D.rotation.set(0, 0, 0)
    this.monsterObj3D.position.set(this.spawnPos.x, this.spawnPos.y, this.spawnPos.z)
    this.monsterObj3D.body.needUpdate = true

    // this will run only on the next update if body.needUpdate = true
    this.monsterObj3D.body.once.update(() => {
      this.currentState = MonsterStates.Idle
      // set body back to dynamic
      this.monsterObj3D.body.setCollisionFlags(0)

      // if you do not reset the velocity and angularVelocity, the object will keep it
      this.monsterObj3D.body.setVelocity(0, 0, 0)
      this.monsterObj3D.body.setAngularVelocity(0, 0, 0)
    })
  }

  spinAttack(time: number) {
    if (time - this.prevSpecialTime > this.specialCooldown) {
      if (!PLAYERREF.player) return

      const monsterDir = new THREE.Vector3()
      this.monsterObj3D.getWorldDirection(monsterDir)
      monsterDir.multiplyScalar(2)

      const targetX = PLAYERREF.player.position.x + monsterDir.x
      const targetY = PLAYERREF.player.position.y + monsterDir.y + 1
      const targetZ = PLAYERREF.player.position.z + monsterDir.z

      this.prevSpecialTime = time

      let tmp = this.monsterObj3D.position.clone()
      this.monsterObj3D.body.setCollisionFlags(2)

      this.scene.tweens.add({
        targets: tmp,
        ease: 'linear',
        duration: 1000,
        x: targetX,
        y: targetY,
        z: targetZ,
        // yoyo: true,
        onUpdate: () => {
          this.monsterObj3D.position.set(tmp.x, tmp.y, tmp.z)
          this.monsterObj3D.rotateY(0.2)
          this.monsterObj3D.body.needUpdate = true
        },
        onComplete: () => {
          this.monsterObj3D.body.needUpdate = true
          this.monsterObj3D.body.setCollisionFlags(0)
          this.monsterObj3D.body.setVelocity(0, 0, 0)
          this.monsterObj3D.body.setAngularVelocity(0, 0, 0)
        }
      })
    }
  }

  shootProjectile(time: number) {
    if (time - this.prevProjectileTime > this.projectileCooldown) {
      this.prevProjectileTime = time
      const monsterDir = new THREE.Vector3()
      const monsterPos = new THREE.Vector3()
      const force = new THREE.Vector3()
      this.monsterObj3D.getWorldDirection(force)
      this.monsterObj3D.getWorldDirection(monsterDir)
      this.monsterObj3D.getWorldPosition(monsterPos)
      monsterDir.addVectors(monsterDir, monsterPos)
      const projectile = this.scene.third.physics.add.sphere(
        {
          radius: 0.5,
          x: monsterDir.x,
          y: monsterDir.y,
          z: monsterDir.z,
          mass: 10
        },
        {
          lambert: {
            color: 'red',
            transparent: true,
            opacity: 0.5
          }
        }
      )
      projectile.body.setGravity(0, -1, 0)
      projectile.body.on.collision((otherObj, event) => {
        if (otherObj.userData.name === MAGE) {
          this.dealDamage()
        }
      })
      force.multiplyScalar(70)
      projectile.body.applyForce(force.x, force.y, force.z)
      setTimeout(() => {
        this.scene.third.destroy(projectile)
      }, 3000)
    }
  }

  checkIfPlayerInRange() {
    if (!PLAYERREF.player) return

    const monsterPosition = this.monsterObj3D.position
    if (Math.abs(PLAYERREF.player.position.y - monsterPosition.y) > 1.5) return
    const sweepRadius = 30

    const xRange = [monsterPosition.x - sweepRadius, monsterPosition.x + sweepRadius]
    const zRange = [monsterPosition.z - sweepRadius, monsterPosition.z + sweepRadius]
    if (checkCollisionWithPlayer(xRange, zRange)) {
      this.currentState = MonsterStates.DetectsPlayer
    }
  }

  bossCheckIfPlayerInRange() {
    // use static range
    // tp boss to spawn then
    if (this.xRange && this.zRange) {
      if (checkCollisionWithPlayer(this.xRange, this.zRange)) {
        this.monsterObj3D.position.set(this.spawnPos.x, this.spawnPos.y, this.spawnPos.z)
        this.monsterObj3D.body.setCollisionFlags(0)
        this.monsterObj3D.body.needUpdate = true
        this.currentState = MonsterStates.DetectsPlayer
      }
    }
  }

  jump(time: number) {
    if (this.canJump && time - this.prevJumpTime > this.jumpCooldown) {
      this.monsterObj3D.body.setVelocityY(6)
      this.prevJumpTime = time
    }
  }

  dealDamage() {
    const curTime = this.scene.time.now
    if (this.scene.time.now - this.prevDmgTime > this.dmgCooldown) {
      PLAYERREF.player?.tookDamage(this.damage)
      this.prevDmgTime = curTime
    }
  }

  tookDamage(dmg: number) {
    if (this.tpingAway) return
    this.currentHP -= dmg
    this.hpBar.scale.set(this.currentHP / this.maxHP, 1, 1)
    if (this.currentHP <= 0) {
      this.dieAndEmitGoodies()
    }
    // if not in detection range and takes damage become aggro
    if (
      this.currentState === MonsterStates.Idle ||
      this.currentState === MonsterStates.BossIdle ||
      this.currentState === MonsterStates.ReturningToSpawn
    ) {
      this.currentState = MonsterStates.DetectsPlayer
    }
  }

  dieAndEmitGoodies() {
    const delayBetweenEmits = 300

    this.currentState = MonsterStates.Dead
    this.hpBar.scale.setScalar(0)

    if (this.monsterType === MonsterTypes.Boss) {
      this.openDoor()
      PLAYERREF.player?.playBossVictorySequence()
    }

    this.monsterObj3D.body.setAngularVelocity(Math.random(), Math.random(), Math.random())

    // create timeout for exp that will be recursively called
    const expTimeout = (expCount: number) => {
      if (expCount < this.expAmount) {
        new Item(this.scene, ItemTypes.EXP, this.monsterObj3D.position, true)
        setTimeout(() => {
          expTimeout(++expCount)
        }, delayBetweenEmits)
      }
    }

    setTimeout(() => {
      expTimeout(0)
    })

    // create timeout for coins that will be recursively called
    const coinTimeout = (coinCount: number) => {
      if (coinCount < this.coinAmount) {
        new Item(this.scene, ItemTypes.Coin, this.monsterObj3D.position, true)
        setTimeout(() => {
          coinTimeout(++coinCount)
        }, delayBetweenEmits)
      }
    }

    // offset the coin timeout
    setTimeout(() => {
      coinTimeout(0)
    }, 75)

    // respawning timeout
    setTimeout(() => {
      this.hpBar.scale.setScalar(1)
      this.currentHP = this.maxHP
      if (this.monsterType === MonsterTypes.Boss) {
        this.bossTPAway()
      } else {
        this.respawn()
      }
    }, this.respawnTime)
  }

  checkIfPlayerAlive() {
    if (!PLAYERREF.player?.isAlive()) {
      this.currentState = MonsterStates.ReturningToSpawn
    }
  }

  checkIfPlayerRespawning() {
    if (PLAYERREF.player?.isRespawning()) {
      this.currentState = MonsterStates.ReturningToSpawn
    }
  }

  // called by mainscene's update
  update(time: number, delta: number) {
    // handle boss enemies
    if (this.monsterType === MonsterTypes.Boss) {
      if (this.currentState === MonsterStates.BossIdle || this.currentState === MonsterStates.Idle) {
        this.bossCheckIfPlayerInRange()
      } else if (this.currentState === MonsterStates.DetectsPlayer) {
        this.lockPlayerIn()
        this.checkIfPlayerRespawning()
        this.rotateTowardsPlayer()
        this.jump(time)
        this.moveForwards()
        this.spinAttack(time)
        this.shootProjectile(time)
      } else if (this.currentState === MonsterStates.ReturningToSpawn) {
        if (this.tpingAway) return
        this.bossTPAway()
      }
      return
    }
    // handle non boss monsters
    if (this.monsterObj3D.position.y < MONSTEROUTOFBOUNDSY && this.currentState !== MonsterStates.Dead) {
      this.respawn()
    }
    if (this.currentState === MonsterStates.Idle) {
      this.checkIfPlayerInRange()
    } else if (this.currentState === MonsterStates.DetectsPlayer) {
      this.checkIfPlayerAlive()
      this.checkIfPlayerRespawning()
      this.rotateTowardsPlayer()
      this.jump(time)
      this.moveForwards()
      // perform additional attack patterns based on monster type
      if (this.monsterType === MonsterTypes.Rook) this.spinAttack(time)
      if (this.monsterType === MonsterTypes.Bishop) this.shootProjectile(time)
    } else if (this.currentState === MonsterStates.ReturningToSpawn) {
      this.moveToSpawn()
      this.jump(time)
    } else if (this.currentState === MonsterStates.Dead) {
      // nothing here because dead
    }
  }
}
