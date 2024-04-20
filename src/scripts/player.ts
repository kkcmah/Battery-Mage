import { ExtendedMesh, ExtendedObject3D, Scene3D, THREE, ThirdPersonControls } from '@enable3d/phaser-extension'

import { IFRAMES, HALFPI, WEAPONS, WEAPONNAMES, COIN, PLAYERREF } from './constants'
import Weapon from './weapon'
import Monster from './monster'

export default class Player extends ExtendedObject3D {
  scene: Scene3D
  crossHair: Phaser.GameObjects.Arc
  keys: {
    w: Phaser.Input.Keyboard.Key
    a: Phaser.Input.Keyboard.Key
    s: Phaser.Input.Keyboard.Key
    d: Phaser.Input.Keyboard.Key
    interact: Phaser.Input.Keyboard.Key
    slot1: Phaser.Input.Keyboard.Key
    slot2: Phaser.Input.Keyboard.Key
    slot3: Phaser.Input.Keyboard.Key
    slotHP: Phaser.Input.Keyboard.Key
    space: Phaser.Input.Keyboard.Key
  }
  canJump: boolean
  controls: ThirdPersonControls
  hPText: Phaser.GameObjects.BitmapText
  playerHPBar: Phaser.GameObjects.Rectangle
  weapons: { [key: string]: Weapon }
  speed: number
  activeWeapon: Weapon
  constructor(scene: Scene3D) {
    super()
    this.scene = scene
    this.weapons = {}
    this.speed = 5
    this.loadHPBar()
    this.setUpKeys()
    this.loadCrossHair()
    this.loadPlayer()
  }

  loadPlayer() {
    // add player
    this.scene.third.load.gltf('/assets/glb/BatteryMageWithAllWandsV1.glb').then((object) => {
      const mage = object.scene.children[0]
      this.name = 'mage'
      this.add(mage)
      this.position.set(0, 0, 0)
      this.scale.setScalar(0.5)
      // add shadow
      const emitZone = 'EmitZone'
      this.traverse((child) => {
        if (child.isMesh) {
          if (child.name.includes(emitZone)) {
            const weaponName = child.name.replace(emitZone, '')
            this.weapons[weaponName] = new Weapon(this.scene, WEAPONS[weaponName], child)
          }
          child.castShadow = child.receiveShadow = true
          // https://discourse.threejs.org/t/cant-export-material-from-blender-gltf/12258
          //@ts-ignore
          child.material.roughness = 1
          //@ts-ignore
          child.material.metalness = 0
        }
      })
      this.activeWeapon = this.weapons[WEAPONNAMES[0]]
      this.activeWeapon.weapon.visible = true

      /**
       * Animations
       */
      this.scene.third.animationMixers.add(this.anims.mixer)
      object.animations.forEach((animation) => {
        if (animation.name) {
          this.anims.add(animation.name, animation)
        }
      })
      this.anims.play('idle')
      this.scene.third.add.existing(this)
      this.scene.third.physics.add.existing(this, {
        shape: 'box',
        offset: { y: -0.55 },
        height: 2
      })
      // TODO bad pattern making a global player ref
      PLAYERREF.player = this
      // add a sensor for feet
      const sensorFeet = new ExtendedObject3D()
      sensorFeet.position.setY(-0.5)
      this.scene.third.physics.add.existing(sensorFeet, {
        mass: 1e-8,
        shape: 'box',
        width: 0.2,
        height: 0.1,
        depth: 0.2
      })
      sensorFeet.body.setCollisionFlags(4)

      // connect sensor to player
      this.scene.third.physics.add.constraints.lock(this.body, sensorFeet.body)

      // detect if sensor is on the ground
      sensorFeet.body.on.collision((otherObject, event) => {
        if (otherObject.userData.isGround) {
          if (event !== 'end') this.canJump = true
          else this.canJump = false
        }
      })
      this.body.setFriction(0.8)
      this.body.setAngularFactor(0, 0, 0)

      // add third person controls
      this.controls = new ThirdPersonControls(this.scene.third.camera, this, {
        offset: new THREE.Vector3(0, 1.5, 0.8),
        targetRadius: 4
      })
      // ability to see through ground if tilted up
      this.scene.third.camera.near = 2
      this.scene.third.camera.updateProjectionMatrix()

      // lock the pointer and update the third person control
      this.scene.input.on('pointerdown', () => {
        this.scene.input.mouse.requestPointerLock()
      })
      this.scene.input.on('pointermove', (pointer) => {
        if (this.scene.input.mouse.locked) {
          this.controls.update(pointer.movementX, pointer.movementY)
        }
      })
      this.scene.events.on('update', () => {
        this.controls.update(0, 0)
      })
      // add listeners for swapping weapons
      this.keys.slot1.on('down', () => {
        this.swapToWeapon(WEAPONNAMES[0])
      })
      this.keys.slot2.on('down', () => {
        this.swapToWeapon(WEAPONNAMES[1])
      })
      this.keys.slot3.on('down', () => {
        this.swapToWeapon(WEAPONNAMES[2])
      })
      this.keys.slotHP.on('down', () => {
        this.usePotion()
      })
      this.setUpCollisionListeners()
    })
  }

  setUpCollisionListeners() {
    this.body.on.collision((otherObj, event) => {
      if (otherObj.name === COIN && !otherObj.userData.isCollected && event === 'start') {
        console.log('coin collected')
        // otherObj.visible = false
        otherObj.userData.isCollected = true
        // this.scene.third.destroy(otherObj)
      }
    })
  }

  loadHPBar() {
    // player hp bar and background for it
    const hpBarWidth = 400
    const hpBarHeight = 40
    const hpBarBorder = 5

    let hpBarOffsetY = (hpBarHeight + hpBarBorder) * 0.6

    let hpBarBackground = this.scene.add.rectangle(0, 0, hpBarWidth + hpBarBorder, hpBarHeight + hpBarBorder, 0x5a639e)
    hpBarBackground.setPosition(this.scene.scale.width * 0.5, this.scene.scale.height - hpBarOffsetY)
    this.playerHPBar = this.scene.add.rectangle(0, 0, hpBarWidth, hpBarHeight, 0x32d14f)
    Phaser.Display.Align.In.Center(this.playerHPBar, hpBarBackground)
    this.hPText = this.scene.add.bitmapText(0, 0, 'battery', '100 / 100', 30).setDepth(1)
    Phaser.Display.Align.In.Center(this.hPText, this.playerHPBar)
  }

  setUpKeys() {
    // add keys
    this.keys = {
      w: this.scene.input.keyboard.addKey('w'),
      a: this.scene.input.keyboard.addKey('a'),
      s: this.scene.input.keyboard.addKey('s'),
      d: this.scene.input.keyboard.addKey('d'),
      interact: this.scene.input.keyboard.addKey('e'),
      slot1: this.scene.input.keyboard.addKey(49),
      slot2: this.scene.input.keyboard.addKey(50),
      slot3: this.scene.input.keyboard.addKey(51),
      slotHP: this.scene.input.keyboard.addKey(55),
      space: this.scene.input.keyboard.addKey(32)
    }
  }

  loadCrossHair() {
    // add red dot cross hair
    this.crossHair = this.scene.add.circle(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height / 2,
      4,
      0xff0000
    )
    this.crossHair.depth = 2
  }

  jump() {
    //TODO anims...
    this.body.applyForceY(3)
  }

  respawn() {
    // set body to be kinematic
    this.body.setCollisionFlags(2)

    // set the new position
    this.position.set(2, 4, 2)
    this.body.needUpdate = true

    // this will run only on the next update if body.needUpdate = true
    this.body.once.update(() => {
      // set body back to dynamic
      this.body.setCollisionFlags(0)

      // if you do not reset the velocity and angularVelocity, the object will keep it
      this.body.setVelocity(0, 0, 0)
      this.body.setAngularVelocity(0, 0, 0)
    })
  }

  // TODO
  tookDamage() {
    this.playerHPBar.setSize(this.playerHPBar.width - 1, this.playerHPBar.height)
    // this.scoreText.setText(`${currentHP} / 100`)
    this.hPText.setText(`${this.playerHPBar.width} / 100`)
    Phaser.Display.Align.In.Center(this.hPText, this.playerHPBar)
  }

  swapToWeapon(weaponName: string) {
    if (this.weapons[weaponName].canSwapTo()) {
      this.activeWeapon.weapon.visible = false
      this.activeWeapon = this.weapons[weaponName]
      this.activeWeapon.weapon.visible = true
    }
  }

  // TODO
  usePotion() {
    console.log('gulp gulp')
  }

  // called by scene's update - player movement and actions
  update(time: number, delta: number) {
    if (!this.body || !this.controls) {
      return
    }
    const direction = new THREE.Vector3()
    const rotation = this.scene.third.camera.getWorldDirection(direction)
    const theta = Math.atan2(rotation.x, rotation.z)
    const rotationPlayer = this.getWorldDirection(direction)
    const thetaPlayer = Math.atan2(rotationPlayer.x, rotationPlayer.z)
    this.body.setAngularVelocityY(0)

    const l = Math.abs(theta - thetaPlayer)
    let rotationSpeed = 5
    let d = Math.PI / 24

    if (l > d) {
      if (l > Math.PI - d) rotationSpeed *= -1
      if (theta < thetaPlayer) rotationSpeed *= -1
      this.body.setAngularVelocityY(rotationSpeed)
    }

    // move forwards and backwards
    if (this.keys.w.isDown) {
      let x = Math.sin(theta) * this.speed
      let y = this.body.velocity.y
      let z = Math.cos(theta) * this.speed
      this.body.setVelocity(x, y, z)
      // console.log(`${x}, ${y}, ${z}`)
    } else if (this.keys.s.isDown) {
      let halfSpeed = this.speed * 0.5
      let x = Math.sin(theta) * halfSpeed
      let y = this.body.velocity.y
      let z = Math.cos(theta) * halfSpeed
      this.body.setVelocity(-x, y, -z)
    }

    // move sideways
    if (this.keys.a.isDown) {
      let x = Math.sin(theta + HALFPI) * this.speed
      let y = this.body.velocity.y
      let z = Math.cos(theta + HALFPI) * this.speed
      this.body.setVelocity(x, y, z)
    } else if (this.keys.d.isDown) {
      let x = Math.sin(theta - HALFPI) * this.speed
      let y = this.body.velocity.y
      let z = Math.cos(theta - HALFPI) * this.speed
      this.body.setVelocity(x, y, z)
    }

    if (this.keys.space.isDown && this.canJump) {
      this.jump()
    }

    if (this.position.y < -10) {
      this.respawn()
    }

    if (this.scene.input.mousePointer.leftButtonDown()) {
      this.activeWeapon.useWeapon()
      // TODO remove later
      this.tookDamage()
    }
  }
}
