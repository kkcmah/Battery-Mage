import { Scene3D, THREE } from '@enable3d/phaser-extension'

import { GROUNDTWEENDUR, PLAYERREF, ZAP } from './constants'
import { getRandomBetween } from './utils'
import { groundHeights, groundRGBs } from './groundData'
import Item, { ItemTypes } from './item'

export default class Ground {
  scene: Scene3D
  constructor(scene: Scene3D) {
    this.scene = scene
  }

  generateGround() {
    const boxX = 5
    const boxHeight = 5
    const yOffset = -9
    const spawnRadius = 2
    // further multiply x and z pos of boxes so they dont constantly collide with eachother
    const SPREADMULTFACTOR = 1.0001
    // assume square ground
    const GROUNDX = 30 // 30
    // ensure that ground heights differ by 10s else if you change this magic 0.1 number
    // yOffset and jump height would need to be changed as well
    const GROUNDHEIGHTFACTOR = 0.1

    for (let i = 0; i < GROUNDX; i++) {
      for (let j = 0; j < GROUNDX; j++) {
        let colorStartRed = i * GROUNDX + j
        // get random between min and max
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
        let gray = Math.floor(getRandomBetween(50, 150))
        let newBox = this.scene.third.physics.add.box(
          {
            x: i * boxX * SPREADMULTFACTOR,
            y: yOffset + groundHeights[colorStartRed] * GROUNDHEIGHTFACTOR,
            z: j * boxX * SPREADMULTFACTOR,
            width: boxX,
            depth: boxX,
            height: boxHeight,
            mass: 0
          },
          {
            lambert: {
              // color: `rgb(${groundRGBs[colorStartRed][0]}, ${groundRGBs[colorStartRed][1]}, ${groundRGBs[colorStartRed][2]})`
              color: `rgb(${gray}, ${gray}, ${gray})`
            }
          }
        )
        newBox.body.setCollisionFlags(2)
        newBox.body.setAngularFactor(0, 0, 0)
        newBox.body.setLinearFactor(0, 0, 0)
        newBox.userData = { isColored: false, isGround: true }
        // collision somehow doesnt work when i name it
        // newBox.name = 'ground'
        newBox.body.on.collision((otherObj, event) => {
          if (otherObj.userData.name === ZAP && !newBox.userData.isColored) {
            this.scene.third.destroy(newBox)

            PLAYERREF.player?.litObject()
            newBox = this.scene.third.physics.add.box(
              {
                x: i * boxX * SPREADMULTFACTOR,
                y: yOffset + groundHeights[colorStartRed] * GROUNDHEIGHTFACTOR,
                z: j * boxX * SPREADMULTFACTOR,
                width: boxX,
                depth: boxX,
                height: boxHeight
              },
              {
                lambert: {
                  color: `rgb(${groundRGBs[colorStartRed][0]}, ${groundRGBs[colorStartRed][1]}, ${groundRGBs[colorStartRed][2]})`
                }
              }
            )
            newBox.body.setCollisionFlags(2)
            newBox.body.setAngularFactor(0, 0, 0)
            newBox.body.setLinearFactor(0, 0, 0)
            newBox.userData = { isColored: true, isGround: true }

            // get position
            let tmp = newBox.position.clone()

            // tween the position
            this.scene.tweens.add({
              targets: tmp,
              ease: 'sine.inout',
              duration: GROUNDTWEENDUR,
              y: '+=1',
              yoyo: true,
              onUpdate: () => {
                newBox.position.set(tmp.x, tmp.y, tmp.z)
                newBox.body.needUpdate = true
              },
              onComplete: () => {
                this.scene.third.destroy(newBox)
                newBox = this.scene.third.physics.add.box(
                  {
                    x: i * boxX * SPREADMULTFACTOR,
                    y: yOffset + groundHeights[colorStartRed] * GROUNDHEIGHTFACTOR,
                    z: j * boxX * SPREADMULTFACTOR,
                    width: boxX,
                    depth: boxX,
                    height: boxHeight,
                    mass: 0
                  },
                  {
                    lambert: {
                      color: `rgb(${groundRGBs[colorStartRed][0]}, ${groundRGBs[colorStartRed][1]}, ${groundRGBs[colorStartRed][2]})`
                    }
                  }
                )
                newBox.body.setCollisionFlags(2)
                newBox.body.setAngularFactor(0, 0, 0)
                newBox.body.setLinearFactor(0, 0, 0)
                newBox.userData = { isColored: true, isGround: true }
              }
            })

            const coinXR = getRandomBetween(-spawnRadius, spawnRadius)
            const coinY = tmp.y + boxHeight * 0.5
            const coinZR = getRandomBetween(-spawnRadius, spawnRadius)
            const coinEmitPos = new THREE.Vector3(tmp.x + coinXR, coinY, tmp.z + coinZR)
            new Item(
              this.scene,
              ItemTypes.Coin,
              coinEmitPos
              // new THREE.Vector3(0, 10, 0),
              // // using random coin x and z for angular velocity is good enough
              // new THREE.Vector3(coinXR, 1, coinZR)
            )

            const expXR = getRandomBetween(-spawnRadius, spawnRadius)
            const expY = coinY
            const expZR = getRandomBetween(-spawnRadius, spawnRadius)
            const expEmitPos = new THREE.Vector3(tmp.x + expXR, expY, tmp.z + expZR)
            new Item(this.scene, ItemTypes.EXP, expEmitPos)
          }
        })
      }
    }
  }
}
