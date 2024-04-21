import { ExtendedMesh, ExtendedObject3D, Scene3D, THREE, ThirdPersonControls } from '@enable3d/phaser-extension'

import {
  IFRAMES,
  HALFPI,
  WEAPONS,
  WEAPONNAMES,
  COIN,
  PLAYERREF,
  OUTOFBOUNDSY,
  ShopItemData,
  POTION,
  HPBARWIDTH,
  POTIONHEALAMT,
  UIBOXALPHA,
  LIGHTUPPABLES
} from './constants'
import Weapon from './weapon'
import Monster from './monster'
import Npc, { NpcTypes } from './npc'
import { ItemTypes } from './item'

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
  currentHP: number = 100
  maxHP: number = 100
  weapons: { [key: string]: Weapon } = {}
  weaponUIImgs: { [key: string]: Phaser.GameObjects.Image } = {}
  weaponUIBoxes: { [key: string]: Phaser.GameObjects.Rectangle } = {}
  speed: number = 5
  activeWeapon: Weapon
  coinCount: number = 0
  potionCount: number = 10
  numLitObjs: number = 0
  percentLitText: Phaser.GameObjects.BitmapText
  litTextPercent: number = 0
  coinCountText: Phaser.GameObjects.BitmapText
  constructor(scene: Scene3D) {
    super()
    this.scene = scene
    this.loadHPBar()
    this.loadWeaponBar()
    this.loadPotionBar()
    this.loadExpBar()
    this.loadCoinBar()
    this.loadPercentLitText()
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

      const emitZone = 'EmitZone'
      this.traverse((child) => {
        if (child.isMesh) {
          if (child.name.includes(emitZone)) {
            const weaponName = child.name.replace(emitZone, '')
            this.weapons[weaponName] = new Weapon(this.scene, WEAPONS[weaponName], child)
          }
          // add shadow
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
      // TODO kinda messy creating shop weapon npcs from here because of the way I made my model
      this.createShopWeapons()

      /**
       * Animations
       */
      this.scene.third.animationMixers.add(this.anims.mixer)
      object.animations.forEach((animation) => {
        if (animation.name) {
          this.anims.add(animation.name, animation)
        }
      })
      this.anims.play('running')
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

  // TODO collide with monster and take damage
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
    const hpBarHeight = 40
    const hpBarBorder = 5

    let hpBarOffsetY = (hpBarHeight + hpBarBorder) * 0.6

    let hpBarBackground = this.scene.add.rectangle(0, 0, HPBARWIDTH + hpBarBorder, hpBarHeight + hpBarBorder, 0x5a639e)
    hpBarBackground.setPosition(this.scene.scale.width * 0.5, this.scene.scale.height - hpBarOffsetY)
    this.playerHPBar = this.scene.add.rectangle(0, 0, HPBARWIDTH, hpBarHeight, 0x32d14f)
    Phaser.Display.Align.In.Center(this.playerHPBar, hpBarBackground)
    this.hPText = this.scene.add.bitmapText(0, 0, 'battery', `${this.currentHP} / ${this.maxHP}`, 30).setDepth(1)
    Phaser.Display.Align.In.Center(this.hPText, this.playerHPBar)
  }

  loadWeaponBar() {
    const weaponBarWidth = 195
    const weaponBarHeight = 40
    const weaponBarBorder = 5
    const weaponBoxWidth = 60

    let weaponBarOffsetY = (weaponBarHeight + weaponBarBorder) * 0.6

    let weaponBarBackground = this.scene.add.rectangle(
      0,
      0,
      weaponBarWidth + weaponBarBorder,
      weaponBarHeight + weaponBarBorder,
      0x5a639e
    )
    weaponBarBackground.setPosition(this.scene.scale.width * 0.21, this.scene.scale.height - weaponBarOffsetY)

    const box1 = this.scene.add.rectangle(0, 0, weaponBoxWidth, weaponBarHeight, 0xffff00).setAlpha(UIBOXALPHA)
    Phaser.Display.Align.In.LeftCenter(box1, weaponBarBackground, -weaponBarBorder)
    const box1Text = this.scene.add.text(0, 0, '1', { fontSize: '22px', color: '#000000' }).setDepth(1).setAngle(-20)
    Phaser.Display.Align.In.TopLeft(box1Text, box1)
    const wep1 = this.scene.add.image(-100, -100, 'zap').setSize(5, 5)
    wep1.setAlpha(1)
    Phaser.Display.Align.In.Center(wep1, box1)
    this.weaponUIImgs[WEAPONNAMES[0]] = wep1
    this.weaponUIBoxes[WEAPONNAMES[0]] = box1

    const box2 = this.scene.add.rectangle(0, 0, weaponBoxWidth, weaponBarHeight, 0xffff00).setAlpha(UIBOXALPHA)
    Phaser.Display.Align.In.LeftCenter(box2, weaponBarBackground, -weaponBarBorder * 2 - weaponBoxWidth)
    const box2Text = this.scene.add.text(0, 0, '2', { fontSize: '22px', color: '#000000' }).setDepth(1).setAngle(-20)
    Phaser.Display.Align.In.TopLeft(box2Text, box2)
    const wep2 = this.scene.add.image(-100, -100, 'zap2').setSize(5, 5)
    wep2.setAlpha(0)
    Phaser.Display.Align.In.Center(wep2, box2)
    this.weaponUIImgs[WEAPONNAMES[1]] = wep2
    this.weaponUIBoxes[WEAPONNAMES[1]] = box2

    const box3 = this.scene.add.rectangle(0, 0, weaponBoxWidth, weaponBarHeight, 0xffff00).setAlpha(UIBOXALPHA)
    Phaser.Display.Align.In.LeftCenter(box3, weaponBarBackground, -weaponBarBorder * 3 - weaponBoxWidth * 2)
    const box3Text = this.scene.add.text(0, 0, '3', { fontSize: '22px', color: '#000000' }).setDepth(1).setAngle(-20)
    Phaser.Display.Align.In.TopLeft(box3Text, box3)
    const wep3 = this.scene.add.image(-100, -100, 'zap2').setSize(5, 5)
    wep3.setAlpha(0)
    Phaser.Display.Align.In.Center(wep3, box3)
    this.weaponUIImgs[WEAPONNAMES[2]] = wep3
    this.weaponUIBoxes[WEAPONNAMES[2]] = box3
  }

  loadPotionBar() {
    const potionBarWidth = 70
    const potionBarHeight = 40
    const potionBarBorder = 5

    let potionBarOffsetY = (potionBarHeight + potionBarBorder) * 0.6

    let weaponBarBackground = this.scene.add.rectangle(
      0,
      0,
      potionBarWidth + potionBarBorder,
      potionBarHeight + potionBarBorder,
      0x5a639e
    )
    weaponBarBackground.setPosition(this.scene.scale.width * 0.7, this.scene.scale.height - potionBarOffsetY)
    const box1 = this.scene.add.rectangle(0, 0, potionBarWidth, potionBarHeight, 0xffff00).setAlpha(UIBOXALPHA)
    Phaser.Display.Align.In.Center(box1, weaponBarBackground)
    const box1Text = this.scene.add.text(0, 0, '7', { fontSize: '22px', color: '#000000' }).setDepth(1).setAngle(-20)
    Phaser.Display.Align.In.TopLeft(box1Text, box1)
  }

  loadCoinBar() {
    const coinBarWidth = 90
    const coinBarHeight = 40
    const coinBarBorder = 5

    let coinBarOffsetY = (coinBarHeight + coinBarBorder) * 0.6

    let coinBarBackground = this.scene.add
      .rectangle(0, 0, coinBarWidth + coinBarBorder, coinBarHeight + coinBarBorder, 0x5a639e)
      .setVisible(false)
    coinBarBackground.setPosition(this.scene.scale.width * 0.78, this.scene.scale.height - coinBarOffsetY)
    const coinUI = this.scene.add.circle(0, 0, 10, 0xfae207)
    Phaser.Display.Align.In.LeftCenter(coinUI, coinBarBackground)
    this.coinCountText = this.scene.add
      .bitmapText(0, this.scene.scale.height - 42, 'battery', `${this.coinCount}`, 30)
      .setDepth(1)
    Phaser.Display.Align.In.LeftCenter(this.coinCountText, coinBarBackground, -25)
  }

  loadPercentLitText() {
    this.percentLitText = this.scene.add
      .bitmapText(0, this.scene.scale.height - 42, 'battery', '0% Lit', 30)
      .setDepth(1)
  }

  litObject() {
    this.numLitObjs++
    const newLitTextPercent = Math.floor((this.numLitObjs / LIGHTUPPABLES) * 100)
    if (newLitTextPercent !== this.litTextPercent) {
      this.litTextPercent = newLitTextPercent
      this.percentLitText.setText(`${newLitTextPercent}% Lit`)
    }
  }

  loadExpBar() {
    const expInnerRadius = 60
    const expOuterRadius = 80
    const expBarBorder = 5

    let expBarOffsetY = expInnerRadius * 0.6

    let expBarBackground = this.scene.add.star(
      0,
      0,
      7,
      expInnerRadius + expBarBorder,
      expOuterRadius + expBarBorder,
      0x5a639e
    )
    expBarBackground.setPosition(this.scene.scale.width * 0.9, this.scene.scale.height - expBarOffsetY)
    const expbar = this.scene.add.star(0, 0, 7, expInnerRadius, expOuterRadius, 0xffff00).setAlpha(0.9)
    Phaser.Display.Align.In.Center(expbar, expBarBackground)
    const expText = this.scene.add.bitmapText(0, 0, 'battery', 'Level 10 \n50%', 20, 1).setDepth(1)
    Phaser.Display.Align.In.Center(expText, expbar)
    expbar.setScale(0.128426146)
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

  createShopWeapons() {
    // TODO messy creating shop weapons called inside player load
    const weaponSpawnPos: THREE.Vector3[] = [
      // first one is dummy
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 4),
      new THREE.Vector3(0, 0, 5)
    ]
    for (let i = 1; i < WEAPONNAMES.length; i++) {
      new Npc(
        this.scene,
        NpcTypes.ShopItem,
        weaponSpawnPos[i],
        this.weapons[WEAPONNAMES[i]].weapon,
        this.weapons[WEAPONNAMES[i]].weaponData
      )
    }
  }

  jump() {
    //TODO anims...
    this.body.applyForceY(3)
  }

  respawn() {
    this.currentHP = 10
    this.updateHPUI()
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

  updateHPUI() {
    const newHPBarWidth = (this.currentHP * HPBARWIDTH) / this.maxHP
    this.playerHPBar.setSize(newHPBarWidth, this.playerHPBar.height)
    this.hPText.setText(`${this.currentHP} / ${this.maxHP}`)
    Phaser.Display.Align.In.Center(this.hPText, this.playerHPBar)
  }

  // TODO
  tookDamage(dmg: number) {
    this.currentHP -= dmg
    if (this.currentHP < 0) {
      this.currentHP = 0
    }
    this.updateHPUI()
  }

  swapToWeapon(weaponName: string) {
    if (this.weapons[weaponName].canSwapTo()) {
      console.log('swap')
      this.weaponUIImgs[this.activeWeapon.weaponData.name].setAlpha(0)
      this.weaponUIImgs[weaponName].setAlpha(1)
      this.activeWeapon.weapon.visible = false
      this.activeWeapon = this.weapons[weaponName]
      this.activeWeapon.weapon.visible = true
    }
  }

  goOnCooldown(weaponName: string) {
    this.weaponUIBoxes[weaponName].setAlpha(0)
    this.scene.tweens.add({
      targets: this.weaponUIBoxes[weaponName],
      duration: this.activeWeapon.weaponData.cooldown,
      alpha: UIBOXALPHA,
      onComplete: () => {
        this.weapons[weaponName].updateCooldown(false)
      }
    })
  }

  recoilFromWeapon(recoilFactor: number) {
    const direction = new THREE.Vector3()
    this.scene.third.camera.getWorldDirection(direction)
    const theta = Math.atan2(direction.x, direction.z)
    let x = Math.sin(theta) * recoilFactor
    let y = 0
    let z = Math.cos(theta) * recoilFactor
    this.body.applyForce(-x, y, -z)
  }

  pickUp(itemType: ItemTypes) {
    if (itemType === ItemTypes.Coin) {
      this.coinCount++
      this.coinCountText.setText(`${this.coinCount}`)
    } else if (itemType === ItemTypes.EXP) {
      console.log('exp')
    }
  }

  // TODO
  usePotion() {
    if (this.potionCount > 0) {
      console.log('gulp gulp')
      this.currentHP += POTIONHEALAMT
      this.potionCount--
      if (this.currentHP > this.maxHP) {
        this.currentHP = this.maxHP
      }
      this.updateHPUI()
    }
  }

  getCoinDiff(shopItemData: ShopItemData): number {
    return shopItemData.cost - this.coinCount
  }

  purchaseItem(shopItemData: ShopItemData) {
    this.coinCount -= shopItemData.cost
    if (shopItemData.name === POTION.name) {
      this.potionCount++
    } else if (this.weapons[shopItemData.name] !== undefined) {
      this.weapons[shopItemData.name].weaponData.isUnlocked = true
    }
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

    if (this.position.y < OUTOFBOUNDSY) {
      this.respawn()
    }

    if (this.scene.input.mousePointer.leftButtonDown()) {
      this.activeWeapon.useWeapon()
      // TODO remove later
      this.tookDamage(1)
    }
  }
}
