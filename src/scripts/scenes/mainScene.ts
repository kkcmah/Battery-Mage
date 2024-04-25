import { ExtendedObject3D, Scene3D, THREE, ThirdPersonControls } from '@enable3d/phaser-extension'

import Ground from '../ground'
import SampleStuffs from '../sampleStuffs'
import Player from '../player'
import Npc, { NpcTypes } from '../npc'
import Monster, { MonsterTypes } from '../monster'
import { MONSTERBISHOPDATA, MONSTERBOSSDATA, MONSTERKNIGHTDATA, MONSTERROOKDATA, MONSTERTESTDATA } from '../monsterData'

export default class MainScene extends Scene3D {
  player: Player
  sampleStuffs: SampleStuffs
  npcs: Npc[] = []
  monsters: Monster[] = []

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
    // this.third.physics.debug?.enable()

    // this.sampleStuffs = new SampleStuffs(this)
    // this.sampleStuffs.loadSampleStuffs()

    // add player
    this.player = new Player(this)
    this.loadBatteryHouse()

    this.loadBackgroundNpcs()
    this.loadKnights()
    this.loadBishops()
    this.loadRooks()
    this.loadBoss()

    // const noPBox = this.third.add.box(
    //   { height: 10 },
    //   { phong: { color: 'rgb(0,255,0)', transparent: true, opacity: 0.1 } }
    // )
    // this.npcs.push(new Npc(this, NpcTypes.Interactable, new THREE.Vector3(2, 0, 2), noPBox))

    // this.monsters.push(new Monster(this, MonsterTypes.Boss, new THREE.Vector3(6, 0, 3), noPBox, MONSTERTESTDATA))

    // this.monsters.push(new Monster(this, MonsterTypes.WaterDrop, new THREE.Vector3(6, 0, 0), noPBox))
    // for (let i = 3; i < 30; i++) {
    //   this.monsters.push(new Monster(this, MonsterTypes.WaterDrop, new THREE.Vector3(3 + i * 4, 3, 3 + i * 4), noPBox))
    // }
  }

  loadBatteryHouse() {
    this.third.load.gltf('assets/glb/BatteryHouse.glb').then((object) => {
      const obj = new ExtendedObject3D()
      obj.add(object.scene)
      obj.position.set(0, -1.5, 0)
      obj.rotation.set(0, -45, 0)
      // obj.scale.setScalar(0.5)
      this.third.add.existing(obj)
      this.third.physics.add.existing(obj, { shape: 'concaveMesh', mass: 0 })
    })
  }

  loadBackgroundNpcs() {
    const backGroundNpcs = [
      [-1.5, 0, 45],
      [5, 0, 21],
      [10, 0, 21],
      [17, 0, 10],
      [1.5, 0, 35],
      [8, 0, 58],
      [18, 0, 37],
      [15, 0, 25],
      [24, 0, 11.5],
      [50, 0, 135]
    ]
    for (let i = 0; i < backGroundNpcs.length; i++) {
      this.npcs.push(
        new Npc(
          this,
          NpcTypes.Background,
          new THREE.Vector3(backGroundNpcs[i][0], backGroundNpcs[i][1], backGroundNpcs[i][2])
        )
      )
    }
  }

  loadKnights() {
    const knightLocations = [
      [41, 0, 83],
      [20, -2, 121],
      [60, -2, 105],
      [72, 0, 68],
      [97, 0, 18],
      [111, 1, 75],
      [135, 1, 143],
      [85.5, 0, 140],
      [125, -1, 25]
    ]
    this.third.load.gltf('assets/glb/Knight.glb').then((object) => {
      const obj = new ExtendedObject3D()
      obj.add(object.scene.children[0])

      obj.scale.setScalar(0.5)
      for (let i = 0; i < knightLocations.length; i++) {
        this.monsters.push(
          new Monster(
            this,
            MonsterTypes.Knight,
            new THREE.Vector3(knightLocations[i][0], knightLocations[i][1], knightLocations[i][2]),
            obj,
            MONSTERKNIGHTDATA
          )
        )
      }
    })
  }

  loadBishops() {
    const bishopLocations = [
      [145, 0, 114.5],
      [105, 0, 142],
      [79, 1, 115.5],
      [140, 1, 56],
      [35, 1, 135]
    ]
    this.third.load.gltf('assets/glb/Bishop.glb').then((object) => {
      const obj = new ExtendedObject3D()
      obj.add(object.scene.children[0])

      obj.scale.setScalar(0.5)
      for (let i = 0; i < bishopLocations.length; i++) {
        this.monsters.push(
          new Monster(
            this,
            MonsterTypes.Bishop,
            new THREE.Vector3(bishopLocations[i][0], bishopLocations[i][1], bishopLocations[i][2]),
            obj,
            MONSTERBISHOPDATA
          )
        )
      }
    })
  }

  loadRooks() {
    const rookLocations = [
      [88, 1, 130],
      [139, 1, 139],
      [126, 1, 85]
    ]
    this.third.load.gltf('assets/glb/Rook.glb').then((object) => {
      const obj = new ExtendedObject3D()
      obj.add(object.scene.children[0])

      obj.scale.setScalar(0.5)
      for (let i = 0; i < rookLocations.length; i++) {
        this.monsters.push(
          new Monster(
            this,
            MonsterTypes.Rook,
            new THREE.Vector3(rookLocations[i][0], rookLocations[i][1], rookLocations[i][2]),
            obj,
            MONSTERROOKDATA
          )
        )
      }
    })
  }

  loadBoss() {
    this.third.load.gltf('assets/glb/Boss.glb').then((object) => {
      const obj = new ExtendedObject3D()
      obj.add(object.scene.children[0])

      obj.scale.setScalar(0.5)
      this.monsters.push(new Monster(this, MonsterTypes.Boss, new THREE.Vector3(122, 1.5, 117), obj, MONSTERBOSSDATA))
    })
  }

  update(time: number, delta: number) {
    this.player.update(time, delta)

    for (let npc of this.npcs) {
      npc.update(time, delta)
    }

    for (let monster of this.monsters) {
      monster.update(time, delta)
    }
  }
}
