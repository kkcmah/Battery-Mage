import { ExtendedMesh, ExtendedObject3D, FirstPersonControls, Scene3D, THREE, ThirdPersonControls } from '@enable3d/phaser-extension'

import Ground from '../ground'
import { ZAP, IFRAMES, HALFPI } from '../constants'


export default class MainScene extends Scene3D {
  crossHair: any;
  player: ExtendedObject3D;
  firstPersonControls: FirstPersonControls;
  keys: { w: Phaser.Input.Keyboard.Key; a: Phaser.Input.Keyboard.Key; s: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key; q: Phaser.Input.Keyboard.Key; e: Phaser.Input.Keyboard.Key; space: Phaser.Input.Keyboard.Key; };
  canJump: boolean;
  controls: ThirdPersonControls;
  singleWand: ExtendedObject3D;
  scoreText: Phaser.GameObjects.BitmapText;
  playerHPBar: Phaser.GameObjects.Rectangle;
  noPBox: ExtendedObject3D;
  yesPBox: ExtendedObject3D;

  constructor() {
    super({ key: 'MainScene' })
  }

  init() {
    this.accessThirdDimension()
    this.canJump = true;
  }

  create() {
    const ground = new Ground(this)
    const groundRGBs = ground.generateGround()
    // creates a nice scene
    this.third.warpSpeed('-orbitControls', '-ground', '-grid')

    // toggle debug
    this.third.physics.debug?.enable()

    // adds a box no physics
    this.noPBox = this.third.add.box({ x: 1, y: 2 }, { phong: { color: 'rgb(0,255,0)' } })

    // adds a static box
    const staticBox = this.third.physics.add.box({ x: 3, y: -1, height: 10 }, { phong: { color: 'green' } })
    staticBox.body.setCollisionFlags(2)

    // adds a box with physics
    this.yesPBox = this.third.physics.add.box({ x: -1, y: 2 })

    // yellow box (with physics)
    const mm = this.third.physics.add.box({ y: 10 }, { lambert: { color: 'yellow', transparent: true, opacity: 0.5 } })
    mm.body.setBounciness(2)

    // compound shape (child based) only physics on body
    // head coords relative to body
    const body = this.third.add.box(
      { height: 0.8, x: -3, y: 1, width: 0.4, depth: 0.4 },
      { lambert: { color: 0xffff00 } }
    )
    const head = this.third.add.sphere({ radius: 0.25, y: 0.25, z: 0.05 }, { lambert: { color: 0xffff00 } })
    this.third.physics.add.existing(body)
    body.add(head)

    // throws some random object on the scene
    // this.third.haveSomeFun()

    this.third.load.gltf('/assets/glb/BatteryMageSingleShotTest.glb').then((gltf) => {
      this.singleWand = new ExtendedObject3D()
      this.singleWand.name = 'singleWand'
      this.singleWand.add(gltf.scene)

      this.third.add.existing(this.singleWand)

      this.singleWand.traverse((child) => {
        console.log('child', child)
        if (child.isMesh) {
          // child.layers.set(1) // mesh is in layer 1
          child.castShadow = child.receiveShadow = true
          //@ts-ignore
          if (child.material) child.material.metalness = 0
        }
      })
      console.log(this.singleWand)
      console.log(gltf.scene)
      // this.third.physics.add.existing(this.singleWand, {shape: 'box', ignoreScale: false})
    })

    // add red dot cross hair
    this.crossHair = this.add.circle(this.cameras.main.width / 2, this.cameras.main.height / 2, 4, 0xff0000)
    this.crossHair.depth = 2

    // add player
    this.player = new ExtendedObject3D()
    this.player.position.setY(1)
    // TODO player is currently just a physics object
    // this.player.add(this.player)
    // this.player.traverse(child => {
    //   console.log(child)
    // })
    this.third.physics.add.existing(this.player, {
      // shape: 'capsule',
      // radius: 0.2,
      // height: 0.6
      //offset: { y: -0.55 }
      shape: 'box',
      width: 0.4,
      depth: 0.6
    })
    // add a sensor for feet
    const sensorFeet = new ExtendedObject3D()
    sensorFeet.position.setY(0.4)
    this.third.physics.add.existing(sensorFeet, { mass: 1e-8, shape: 'box', width: 0.2, height: 0.1, depth: 0.2 })
    sensorFeet.body.setCollisionFlags(4)

    // connect sensor to player
    this.third.physics.add.constraints.lock(this.player.body, sensorFeet.body)

    // detect if sensor is on the ground
    sensorFeet.body.on.collision((otherObject, event) => {
      if (otherObject.userData.isGround) {
        if (event !== 'end') this.canJump = true
        else this.canJump = false
      }
    })
    this.player.body.setFriction(0.8)
    this.player.body.setAngularFactor(0, 0, 0)

    // player hp bar and background for it
    const hpBarWidth = 400
    const hpBarHeight = 40
    const hpBarBorder = 5

    let hpBarOffsetY = (hpBarHeight + hpBarBorder) * 0.6

    let hpBarBackground = this.add.rectangle(0, 0, hpBarWidth + hpBarBorder, hpBarHeight + hpBarBorder, 0x5a639e)
    hpBarBackground.setPosition(this.scale.width * 0.5, this.scale.height - hpBarOffsetY)
    this.playerHPBar = this.add.rectangle(0, 0, hpBarWidth, hpBarHeight, 0x32d14f)
    Phaser.Display.Align.In.Center(this.playerHPBar, hpBarBackground)
    this.scoreText = this.add.bitmapText(0, 0, 'battery', '100 / 100', 30).setDepth(1)
    Phaser.Display.Align.In.Center(this.scoreText, this.playerHPBar)

    // add third person controls
    this.controls = new ThirdPersonControls(this.third.camera, this.player, {
      offset: new THREE.Vector3(0, 1, 0),
      targetRadius: 4
    })
    // ability to see through ground if tilted up
    this.third.camera.near = 2
    this.third.camera.updateProjectionMatrix()

    // lock the pointer and update the third person control
    this.input.on('pointerdown', () => {
      this.input.mouse.requestPointerLock()
    })
    this.input.on('pointermove', (pointer) => {
      if (this.input.mouse.locked) {
        this.controls.update(pointer.movementX, pointer.movementY)
      }
    })
    this.events.on('update', () => {
      this.controls.update(0, 0)
    })

    // add keys
    this.keys = {
      w: this.input.keyboard.addKey('w'),
      a: this.input.keyboard.addKey('a'),
      s: this.input.keyboard.addKey('s'),
      d: this.input.keyboard.addKey('d'),
      q: this.input.keyboard.addKey('q'),
      e: this.input.keyboard.addKey('e'),
      space: this.input.keyboard.addKey(32)
    }
  }

  jump() {
    //TODO check if can jump etc.. anims...
    this.player.body.applyForceY(2);
  }

  respawn() {
    // set body to be kinematic
    this.player.body.setCollisionFlags(2)

    // set the new position
    this.player.position.set(2, 4, 2)
    this.player.body.needUpdate = true

    // this will run only on the next update if body.needUpdate = true
    this.player.body.once.update(() => {
      // set body back to dynamic
      this.player.body.setCollisionFlags(0)

      // if you do not reset the velocity and angularVelocity, the object will keep it
      this.player.body.setVelocity(0, 0, 0)
      this.player.body.setAngularVelocity(0, 0, 0)
    })
  }

  // TODO
  moveTowardsPlayer() {
    const speed = 5
    const dirYesP = new THREE.Vector3()
    const yesPBoxPos = new THREE.Vector3()
    const playerPos = new THREE.Vector3()
    this.yesPBox.getWorldPosition(yesPBoxPos)
    this.player.getWorldPosition(playerPos)
    dirYesP.subVectors( playerPos, yesPBoxPos )
    // this.yesPBox.body.setAngularVelocityY(5)
    this.yesPBox.body.setVelocity(dirYesP.x * speed, dirYesP.y * speed, dirYesP.z * speed)
  }

  // TODO
  setColor() {
    // //@ts-ignore
    // this.OBJ.material.color.set('red')
  }

  // TODO
  tookDamage() {
    this.playerHPBar.setSize(this.playerHPBar.width - 1, this.playerHPBar.height)
    // this.scoreText.setText(`${currentHP} / 100`)
    this.scoreText.setText(`${this.playerHPBar.width} / 100`)
    Phaser.Display.Align.In.Center(this.scoreText, this.playerHPBar)
  }

  update(time, delta) {
    if (this.player && this.player.body && this.controls) {
      const speed = 5
      const direction = new THREE.Vector3()
      const rotation = this.third.camera.getWorldDirection(direction)
      const theta = Math.atan2(rotation.x, rotation.z)
      const rotationPlayer = this.player.getWorldDirection(direction)
      const thetaPlayer = Math.atan2(rotationPlayer.x, rotationPlayer.z)
      this.player.body.setAngularVelocityY(0)

      const l = Math.abs(theta - thetaPlayer)
      let rotationSpeed = 5
      let d = Math.PI / 24

      if (l > d) {
        if (l > Math.PI - d) rotationSpeed *= -1
        if (theta < thetaPlayer) rotationSpeed *= -1
        this.player.body.setAngularVelocityY(rotationSpeed)
      }

      // move forwards and backwards
      if (this.keys.w.isDown) {
        let x = Math.sin(theta) * speed
        let y = this.player.body.velocity.y
        let z = Math.cos(theta) * speed
        this.player.body.setVelocity(x, y, z)
        // console.log(`${x}, ${y}, ${z}`)
      } else if (this.keys.s.isDown) {
        let halfSpeed = speed * 0.5;
        let x = Math.sin(theta) * halfSpeed
        let y = this.player.body.velocity.y
        let z = Math.cos(theta) * halfSpeed
        this.player.body.setVelocity(-x, y, -z)
      }

      // move sideways
      if (this.keys.a.isDown) {
        let x = Math.sin(theta + HALFPI) * speed
        let y = this.player.body.velocity.y
        let z = Math.cos(theta + HALFPI) * speed
        this.player.body.setVelocity(x, y, z)
      } else if (this.keys.d.isDown) {
        let x = Math.sin(theta - HALFPI) * speed
        let y = this.player.body.velocity.y
        let z = Math.cos(theta - HALFPI) * speed
        this.player.body.setVelocity(x, y, z)
      }

      if (this.keys.space.isDown && this.canJump) {
        this.jump()
      }

      if (this.player.position.y < -10) {
        this.respawn()
      }

      if (this.input.mousePointer.leftButtonDown()) {
        // TODO remove these later
        // this.moveTowardsPlayer()
        this.tookDamage()
        const raycaster = new THREE.Raycaster()
        const force = 5
        let wandPos = new THREE.Vector3()
        let pos = new THREE.Vector3()
        // let camDir = new THREE.Vector3()
        // this.third.camera.getWorldDirection(camDir)
        // raycaster.set(wandPos, camDir)
        raycaster.setFromCamera({ x: 0, y: 0 }, this.third.camera)
        // TODO get shooting position to start from wand
        // this.singleWand.getWorldPosition(wandPos)
        this.player.getWorldPosition(wandPos) // remove this later
        pos.copy(raycaster.ray.direction)
        pos.add(wandPos)

        const mageZap = this.third.physics.add.sphere(
          { radius: 0.1, x: pos.x, y: pos.y, z: pos.z, mass: 1}
        )
        mageZap.visible = false
        mageZap.name = ZAP

        // add zap image to physics body
        const zapImg = this.add.image(-100, -100, 'zap')
        let distance = this.third.camera.position.distanceTo(mageZap.position)
        zapImg.setData('initialDistance', distance)

        // using tween as a way to update img
        this.tweens.add({
          targets: zapImg,
          ease: 'sine.inout',
          duration: 500,
          scale: 1,
          onUpdate: () => {
              // adjust the size of the img
            let distance = this.third.camera.position.distanceTo(mageZap.position)
            let size = zapImg.getData('initialDistance') / distance
            zapImg.setScale(size)

            // adjust position of the img
            let pos = this.third.transform.from3dto2d(mageZap.position)
            zapImg.setPosition(pos.x, pos.y)

            zapImg.setAngle(pos.y)
          }
        })

        // TODO limit range of projectiles
        setTimeout(() => {
          this.third.destroy(mageZap)
          zapImg.destroy()
        }, 200);
        
        pos.copy(raycaster.ray.direction)
        pos.multiplyScalar(12)

        mageZap.body.applyForce(pos.x * force, pos.y * force, pos.z * force)

      }
    }
  }
}
