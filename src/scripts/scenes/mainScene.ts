import { ExtendedObject3D, Scene3D, THREE, ThirdPersonControls } from '@enable3d/phaser-extension'

import Ground from '../ground'
import SampleStuffs from '../sampleStuffs'
import Player from '../player'

export default class MainScene extends Scene3D {
  player: Player
  sampleStuffs: SampleStuffs

  constructor() {
    super({ key: 'MainScene' })
  }

  init() {
    this.accessThirdDimension()
  }

  create() {
    const ground = new Ground(this)
    ground.generateGround()
    // creates a nice scene
    this.third.warpSpeed('-orbitControls', '-ground', '-grid')

    // toggle debug
    this.third.physics.debug?.enable()

    // this.sampleStuffs = new SampleStuffs(this)
    // this.sampleStuffs.loadSampleStuffs()

    // add player
    this.player = new Player(this)
  }

  // TODO
  setColor() {
    // //@ts-ignore
    // this.OBJ.material.color.set('red')
  }

  update(time: number, delta: number) {
    this.player.update(time, delta)
  }
}
