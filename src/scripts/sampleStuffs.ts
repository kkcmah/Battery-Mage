import { ExtendedObject3D, Scene3D } from '@enable3d/phaser-extension'

export default class SampleStuffs {
  scene: Scene3D
  noPBox: ExtendedObject3D
  yesPBox: ExtendedObject3D
  singleWand: ExtendedObject3D
  constructor(scene: Scene3D) {
    this.scene = scene
  }

  loadSampleStuffs() {
    // adds a box no physics
    this.noPBox = this.scene.third.add.box({ x: 1, y: 2 }, { phong: { color: 'rgb(0,255,0)' } })

    // adds a static box
    const staticBox = this.scene.third.physics.add.box({ x: 3, y: -1, height: 10 }, { phong: { color: 'green' } })
    staticBox.body.setCollisionFlags(2)

    // adds a box with physics
    this.yesPBox = this.scene.third.physics.add.box({ x: -1, y: 2 })
    this.yesPBox.body.applyForceY(1)
    this.yesPBox.body.setAngularVelocityY(1)

    // yellow box (with physics)
    const mm = this.scene.third.physics.add.box(
      { y: 10 },
      { lambert: { color: 'yellow', transparent: true, opacity: 0.5 } }
    )
    mm.body.setBounciness(2)

    // compound shape (child based) only physics on body
    // head coords relative to body
    const body = this.scene.third.add.box(
      { height: 0.8, x: -3, y: 1, width: 0.4, depth: 0.4 },
      { lambert: { color: 0xffff00 } }
    )
    const head = this.scene.third.add.sphere({ radius: 0.25, y: 0.25, z: 0.05 }, { lambert: { color: 0xffff00 } })
    this.scene.third.physics.add.existing(body)
    body.add(head)

    // throws some random object on the scene
    // this.third.haveSomeFun()

    this.scene.third.load.gltf('/assets/glb/BatteryMageSingleShotTest.glb').then((gltf) => {
      this.singleWand = new ExtendedObject3D()
      this.singleWand.name = 'singleWand'
      this.singleWand.add(gltf.scene)

      this.scene.third.add.existing(this.singleWand)

      this.singleWand.traverse((child) => {
        if (child.isMesh) {
          // child.layers.set(1) // mesh is in layer 1
          child.castShadow = child.receiveShadow = true
          //@ts-ignore
          if (child.material) child.material.metalness = 0
        }
      })
      // this.third.physics.add.existing(this.singleWand, {shape: 'box', ignoreScale: false})
    })
  }
}
