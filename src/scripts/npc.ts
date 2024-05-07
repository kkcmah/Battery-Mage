import { ExtendedObject3D, Scene3D, THREE } from '@enable3d/phaser-extension'
import { checkCollisionWithPlayer, disposeMesh, getRandomBetween } from './utils'
import { OUTOFBOUNDSY, PLAYERREF, ShopItemData, ZAP } from './constants'

export enum NpcTypes {
  Interactable,
  Background,
  ShopItem
}

export default class Npc {
  scene: Scene3D
  npcObj3D: ExtendedObject3D
  npcType: NpcTypes
  spawnPos: THREE.Vector3
  colorRGB: { r: number; g: number; b: number }
  shopItemData: ShopItemData
  constructor(
    scene: Scene3D,
    npcType: NpcTypes,
    spawnPos: THREE.Vector3,
    customNpcObj3D?: ExtendedObject3D,
    shopItemData?: ShopItemData
  ) {
    this.scene = scene
    this.npcType = npcType
    this.spawnPos = spawnPos
    if (shopItemData) this.shopItemData = shopItemData

    if (npcType === NpcTypes.Background) {
      this.constructBackgroundNpc()
    } else if (npcType === NpcTypes.Interactable) {
      // interactable npcs will only use loaded glb files
      if (customNpcObj3D) {
        this.npcObj3D = customNpcObj3D
        this.npcObj3D.position.set(spawnPos.x, spawnPos.y, spawnPos.z)
      }
    } else if (npcType === NpcTypes.ShopItem) {
      if (customNpcObj3D) {
        this.constructShopItem(customNpcObj3D)
      }
    }
  }

  getRandomRGB() {
    return {
      r: Math.floor(getRandomBetween(0, 255)),
      g: Math.floor(getRandomBetween(0, 255)),
      b: Math.floor(getRandomBetween(0, 255))
    }
  }

  constructBackgroundNpc() {
    this.colorRGB = this.getRandomRGB()
    let gray = Math.floor(getRandomBetween(40, 100))
    const body = this.scene.third.add.cone(
      { x: this.spawnPos.x, y: this.spawnPos.y, z: this.spawnPos.z, radius: 0.4, height: 1.1 },
      { lambert: { color: `rgb(${gray}, ${gray}, ${gray})` } }
    )
    const head = this.scene.third.add.sphere(
      { radius: 0.3, y: 0.3, z: 0.02 },
      { lambert: { color: `rgb(${gray}, ${gray}, ${gray})` } }
    )
    this.scene.third.physics.add.existing(body, {
      shape: 'box',
      offset: { y: -0.1 },
      height: 1.4,
      width: 0.7,
      mass: 10
    })
    this.npcObj3D = body.add(head)
    this.npcObj3D.body.setDamping(0.8, 0.8)
    this.npcObj3D.body.setFriction(0.8)
    this.npcObj3D.userData = { isColored: false, isGround: true }
    this.npcObj3D.body.on.collision((otherObj, event) => {
      if (otherObj.userData.name === ZAP && !this.npcObj3D.userData.isColored) {
        PLAYERREF.player?.litObject()
        //@ts-ignore
        this.npcObj3D.material.color.set(`rgb(${this.colorRGB.r}, ${this.colorRGB.g}, ${this.colorRGB.b})`)
        this.npcObj3D.children.forEach((val) => {
          //@ts-ignore
          val.material.color.set(`rgb(${this.colorRGB.r}, ${this.colorRGB.g}, ${this.colorRGB.b})`)
        })
        this.npcObj3D.userData.isColored = true
      }
    })
  }

  constructShopItem(customNpcObj3D: ExtendedObject3D) {
    this.npcObj3D = customNpcObj3D.clone(true)
    this.npcObj3D.visible = true
    this.npcObj3D.position.set(this.spawnPos.x, this.spawnPos.y, this.spawnPos.z)
    this.scene.third.add.existing(this.npcObj3D)

    let collected = false
    let textVisible = false

    let tmp = this.spawnPos.clone()

    let collideHitBox = 0.8
    const xRange = [tmp.x - collideHitBox, tmp.x + collideHitBox]
    const zRange = [tmp.z - collideHitBox, tmp.z + collideHitBox]

    const xRangeShopText = [tmp.x - collideHitBox * 5, tmp.x + collideHitBox * 5]
    const zRangeShopText = [tmp.z - collideHitBox * 5, tmp.z + collideHitBox * 5]

    // TODO uncomment to show collision corners
    // this.scene.third.add.box(
    //   { x: xRange[0], y: 2, z: zRange[0], height: 10, width: 0.2, depth: 0.2 },
    //   { phong: { color: 'rgb(0,255,0)' } }
    // )
    // this.scene.third.add.box(
    //   { x: xRange[1], y: 2, z: zRange[1], height: 10, width: 0.2, depth: 0.2 },
    //   { phong: { color: 'rgb(255,0,0)' } }
    // )
    // this.scene.third.add.box(
    //   { x: xRangeShopText[0], y: 2, z: zRangeShopText[0], height: 10, width: 0.2, depth: 0.2 },
    //   { phong: { color: 'rgb(0,0,255)' } }
    // )
    // this.scene.third.add.box(
    //   { x: xRangeShopText[1], y: 2, z: zRangeShopText[1], height: 10, width: 0.2, depth: 0.2 },
    //   { phong: { color: 'rgb(255,0,255)' } }
    // )

    const shopTextPos = this.spawnPos.clone()
    shopTextPos.y = this.spawnPos.y + 2
    const shopTextBg = this.scene.add.star(-150, -150, 7, 40, 50, 0x404040, 0.4).setVisible(false)
    const shopText = this.scene.add.bitmapText(-100, -100, 'battery', '100 / 100', 30, 1).setDepth(1).setVisible(false)
    Phaser.Display.Align.In.Center(shopText, shopTextBg)
    let distance = this.scene.third.camera.position.distanceTo(tmp)
    shopTextBg.setData('initialDistance', distance)

    const setShopTextVisibility = (newVisibility: boolean) => {
      if (textVisible !== newVisibility) {
        textVisible = newVisibility
        shopTextBg.setVisible(newVisibility)
        shopText.setVisible(newVisibility)
      }
    }

    const destroyShopText = () => {
      shopTextBg.destroy()
      shopText.destroy()
    }

    let thisTween: Phaser.Tweens.Tween | undefined = this.scene.tweens.add({
      targets: tmp,
      ease: 'sine.inout',
      duration: 200,
      y: '+=1',
      useFrames: true,
      repeat: -1,
      yoyo: true,
      onUpdate: () => {
        if (!collected && PLAYERREF.player && checkCollisionWithPlayer(xRangeShopText, zRangeShopText)) {
          let distance = this.scene.third.camera.position.distanceTo(tmp)
          let size = shopTextBg.getData('initialDistance') / distance
          shopTextBg.setScale(size)

          setShopTextVisibility(true)
          shopText.setText(
            `${this.shopItemData.shopText} \n \n cost: ${this.shopItemData.cost} \n\n walk into me to buy`
          )

          let pos = this.scene.third.transform.from3dto2d(shopTextPos)
          shopTextBg.setPosition(pos.x, pos.y)
          Phaser.Display.Align.In.Center(shopText, shopTextBg)

          if (checkCollisionWithPlayer(xRange, zRange)) {
            const coinDiff = PLAYERREF.player.getCoinDiff(this.shopItemData)
            // check if player can buy
            if (coinDiff <= 0) {
              PLAYERREF.player.purchaseItem(this.shopItemData)
              if (this.shopItemData.restockTime) {
                this.npcObj3D.visible = false
                collected = true
                setTimeout(() => {
                  collected = false
                  this.npcObj3D.visible = true
                }, this.shopItemData.restockTime)
                return
              } else {
                // destroy if not a restockable item
                destroyShopText()
                disposeMesh(this.scene, this.npcObj3D)
                thisTween?.remove()
                thisTween = undefined
                return
              }
            } else {
              // cant buy
              shopText.setText(`You require \n ${coinDiff} more coin(s) \n to buy this`)
              Phaser.Display.Align.In.Center(shopText, shopTextBg)
            }
          }
        } else {
          setShopTextVisibility(false)
        }
        this.npcObj3D.position.set(tmp.x, tmp.y, tmp.z)
        this.npcObj3D.rotateX(0.03)
      }
    })
  }

  respawn() {
    // set body to be kinematic
    this.npcObj3D.body.setCollisionFlags(2)

    // set the new position
    this.npcObj3D.rotation.set(0, 0, 0)
    this.npcObj3D.position.set(this.spawnPos.x, this.spawnPos.y, this.spawnPos.z)
    this.npcObj3D.body.needUpdate = true

    // this will run only on the next update if body.needUpdate = true
    this.npcObj3D.body.once.update(() => {
      // set body back to dynamic
      this.npcObj3D.body.setCollisionFlags(0)

      // if you do not reset the velocity and angularVelocity, the object will keep it
      this.npcObj3D.body.setVelocity(0, 0, 0)
      this.npcObj3D.body.setAngularVelocity(0, 0, 0)
    })
  }

  // called by main scene's update
  update(time: number, delta: number) {
    if (this.npcObj3D.position.y < OUTOFBOUNDSY) {
      this.respawn()
    }
  }
}
