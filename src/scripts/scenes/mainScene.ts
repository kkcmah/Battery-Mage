import { ExtendedObject3D, Scene3D, THREE, ThirdPersonControls } from '@enable3d/phaser-extension'

import Ground from '../ground'
import SampleStuffs from '../sampleStuffs'
import Player from '../player'
import Npc, { NpcTypes } from '../npc'

export default class MainScene extends Scene3D {
  player: Player
  sampleStuffs: SampleStuffs
  npcs: Npc[] = []

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

    this.npcs.push(new Npc(this, NpcTypes.Background, new THREE.Vector3(2, 0, 0)))
    const noPBox = this.third.add.box({ x: 1, y: 2 }, { phong: { color: 'rgb(0,255,0)' } })
    this.npcs.push(new Npc(this, NpcTypes.Interactable, new THREE.Vector3(2, 0, 2), noPBox))
  }

  // TODO
  setColor() {
    // //@ts-ignore
    // this.OBJ.material.color.set('red')
  }

  update(time: number, delta: number) {
    this.player.update(time, delta)
    for (let i = 0; i < this.npcs.length; i++) {
      this.npcs[i].update(time, delta)
    }
  }
}
