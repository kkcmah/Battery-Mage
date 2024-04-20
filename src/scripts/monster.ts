import { ExtendedObject3D, Scene3D, THREE } from '@enable3d/phaser-extension'

export default class Monster{
  scene: Scene3D
  monsterObj3D: ExtendedObject3D
  constructor(scene: Scene3D, monsterObj3D: ExtendedObject3D) {
    this.scene = scene
    this.monsterObj3D = monsterObj3D.clone()
    
    this.monsterObj3D.position.set(0, 3, 0)
    this.scene.third.add.existing(monsterObj3D)
    this.scene.third.physics.add.existing(monsterObj3D, {
      shape: 'box',
      offset: { y: -0.55 },
      height: 2
    })
  }

  // TODO
  moveTowardsPlayer(player: ExtendedObject3D) {
    const speed = 5
    const dirMonster = new THREE.Vector3()
    const monsterPos = new THREE.Vector3()
    const playerPos = new THREE.Vector3()
    this.monsterObj3D.getWorldPosition(monsterPos)
    player.getWorldPosition(playerPos)
    dirMonster.subVectors(playerPos, monsterPos)
    this.monsterObj3D.body.setVelocity(dirMonster.x * speed, dirMonster.y * speed, dirMonster.z * speed)
  }
}
