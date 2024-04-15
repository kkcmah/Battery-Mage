import { ExtendedMesh, ExtendedObject3D, FirstPersonControls, Scene3D, THREE, ThirdPersonControls } from '@enable3d/phaser-extension'

const HALFPI = Math.PI * 0.5;

export default class MainScene extends Scene3D {
  crossHair: any;
  player: ExtendedObject3D;
  firstPersonControls: FirstPersonControls;
  keys: { w: Phaser.Input.Keyboard.Key; a: Phaser.Input.Keyboard.Key; s: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key; q: Phaser.Input.Keyboard.Key; e: Phaser.Input.Keyboard.Key; space: Phaser.Input.Keyboard.Key; };
  canJump: boolean;
  controls: ThirdPersonControls;

  constructor() {
    super({ key: 'MainScene' })
  }

  init() {
    this.accessThirdDimension()
    this.canJump = true;
  }

  create() {
    // creates a nice scene
    this.third.warpSpeed('-orbitControls')

    // toggle debug
    this.third.physics.debug?.enable()

    // adds a box no physics
    this.third.add.box({ x: 1, y: 2 }, { phong: { color: 'blue' } })

    // adds a static box
    const staticBox = this.third.physics.add.box({ x: 3, y: 2 }, { phong: { color: 'green' } })
    staticBox.body.setCollisionFlags(2)

    // adds a box with physics
    this.third.physics.add.box({ x: -1, y: 2 })

    // yellow box (with physics)
    const mm = this.third.physics.add.box({ y: 10 }, { lambert: { color: 'yellow', transparent: true, opacity: 0.5 } })
    mm.body.setBounciness(1)

    // compound shape (child based)
    // head coords relative to body
    const body = this.third.add.box({ height: 0.8, x: -3, y: 1, width: 0.4, depth: 0.4 }, { lambert: { color: 0xffff00 } })
    const head = this.third.add.sphere({ radius: 0.25, y: 0.25, z: 0.05 }, { lambert: { color: 0xffff00 } })
    body.add(head)
    this.third.physics.add.existing(body)

    // throws some random object on the scene
    // this.third.haveSomeFun()

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
    this.player.body.setFriction(0.8)
    this.player.body.setAngularFactor(0, 0, 0)

    // add third person controls
    this.controls = new ThirdPersonControls(this.third.camera, this.player, {
      offset: new THREE.Vector3(0, 1, 0),
      targetRadius: 4
    })

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
    this.player.body.applyForceY(1);
  }

  update(time, delta) {
    if (this.player && this.player.body && this.controls) {
      const speed = 4
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
    }
  }
}
