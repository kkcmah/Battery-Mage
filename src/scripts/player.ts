import { ExtendedObject3D, Scene3D, THREE, ThirdPersonControls } from '@enable3d/phaser-extension'

import {
  HALFPI,
  WEAPONS,
  WEAPONNAMES,
  PLAYERREF,
  OUTOFBOUNDSY,
  ShopItemData,
  POTION,
  HPBARWIDTH,
  POTIONHEALAMT,
  UIBOXALPHA,
  LIGHTUPPABLES,
  EXPNEXTLEVELINCREMENTAMT,
  ACTIVEWEPSCALE3DUI,
  DRINKCD,
  ROTDIFF,
  PIMINUSROTDIFF,
  HPCOLOR,
  MAGE,
  PLAYERRESPAWNTIME
} from './constants'
import Weapon from './weapon'
import Npc, { NpcTypes } from './npc'
import { ItemTypes } from './item'
import UI3DObj from './uI3DObj'
import { getRandomBetween } from './utils'

export default class Player extends ExtendedObject3D {
  scene: Scene3D
  crossHair: Phaser.GameObjects.Arc
  keys: {
    w: Phaser.Input.Keyboard.Key
    z: Phaser.Input.Keyboard.Key
    a: Phaser.Input.Keyboard.Key
    q: Phaser.Input.Keyboard.Key
    s: Phaser.Input.Keyboard.Key
    d: Phaser.Input.Keyboard.Key
    interact: Phaser.Input.Keyboard.Key
    slot1: Phaser.Input.Keyboard.Key
    slot2: Phaser.Input.Keyboard.Key
    slot3: Phaser.Input.Keyboard.Key
    slotHP: Phaser.Input.Keyboard.Key
    space: Phaser.Input.Keyboard.Key
    m: Phaser.Input.Keyboard.Key
  }
  canJump: boolean
  infiJump: boolean = false
  controls: ThirdPersonControls
  hPText: Phaser.GameObjects.BitmapText
  playerHPBar: Phaser.GameObjects.Rectangle
  currentHP: number = 100
  maxHP: number = 100
  currentLevel: number = 1
  currentExp: number = 0
  expNextLevel: number = 10
  expBar: Phaser.GameObjects.Star
  expText: Phaser.GameObjects.BitmapText
  dmgFactor: number = 1
  weapons: { [key: string]: Weapon } = {}
  weaponUIBoxes: { [key: string]: Phaser.GameObjects.Rectangle } = {}
  uI3DObjs: { [key: string]: UI3DObj } = {}
  uI3DObjsKeys: string[] = []
  speed: number = 5
  activeWeapon: Weapon
  coinCount: number = 0
  potionCount: number = 0
  potionUIBox: Phaser.GameObjects.Rectangle
  potionCountText: Phaser.GameObjects.BitmapText
  canDrink: boolean = true
  numLitObjs: number = 0
  percentLitText: Phaser.GameObjects.BitmapText
  litTextPercent: number = 0
  coinCountText: Phaser.GameObjects.BitmapText
  sceneAsRect: Phaser.GameObjects.Rectangle
  announcementText: Phaser.GameObjects.BitmapText
  victoryText: Phaser.GameObjects.BitmapText
  alive: boolean = true
  respawning: boolean = false
  isLevelingUp: boolean = false
  setAnim: boolean = false
  audios: { [key: string]: Phaser.Sound.BaseSound } = {}
  muteText: Phaser.GameObjects.BitmapText
  isMuted: boolean = false
  constructor(scene: Scene3D) {
    super()
    this.scene = scene
    this.loadScreenText()
    this.setUpAudio()
    this.setUpKeys()
    this.loadPlayer()
    this.loadPotion()
    this.loadHPBar()
    this.loadWeaponBar()
    this.loadPotionBar()
    this.loadExpBar()
    this.loadCoinBar()
    this.loadPercentLitText()
    this.loadCrossHair()
  }

  setUpAudio() {
    this.audios['background'] = this.scene.sound.add('background', { loop: true })
    this.audios['boss'] = this.scene.sound.add('boss', { loop: true })
    this.audios['wep1'] = this.scene.sound.add('wep1')
    this.audios['wep2'] = this.scene.sound.add('wep2')
    this.audios['wep3'] = this.scene.sound.add('wep3')
    this.audios['coin'] = this.scene.sound.add('coin')
    this.audios['exp1'] = this.scene.sound.add('exp1')
    this.audios['exp2'] = this.scene.sound.add('exp2')
    this.audios['levelup'] = this.scene.sound.add('levelup')
    this.audios['victory'] = this.scene.sound.add('victory')
    this.audios['drink'] = this.scene.sound.add('drink')
    this.audios['buy'] = this.scene.sound.add('buy')

    this.muteText = this.scene.add.bitmapText(0, 0, 'battery', '', 26, 1).setDepth(1)
    Phaser.Display.Align.In.TopLeft(this.muteText, this.sceneAsRect)
    this.isMuted = false
  }

  loadPlayer() {
    // add player
    this.scene.third.load.gltf('assets/glb/BatteryMageWithAllWandsV1.glb').then((object) => {
      const mage = object.scene.children[0]
      this.name = MAGE
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
      this.anims.play('idle')
      this.audios['background'].play()
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
        if (this.infiJump) this.canJump = true
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
        if (this.alive) this.usePotion()
      })
    })
  }

  loadPotion() {
    // load potion and put it in shop and ui bar
    this.scene.third.load.gltf('assets/glb/Potion.glb').then((object) => {
      const potion = new ExtendedObject3D()
      potion.add(object.scene.children[0])

      potion.position.set(-1.5, 0, 45)
      potion.scale.setScalar(0.3)
      this.scene.third.add.existing(potion)
      new Npc(this.scene, NpcTypes.ShopItem, new THREE.Vector3(5.5, -1, 40), potion, POTION)

      this.uI3DObjs[POTION.name] = new UI3DObj(this.scene, this.potionUIBox, potion, false)
      this.uI3DObjsKeys.push(POTION.name)
    })
  }

  loadHPBar() {
    // player hp bar and background for it
    const hpBarHeight = 40
    const hpBarBorder = 5

    let hpBarOffsetY = (hpBarHeight + hpBarBorder) * 0.6

    let hpBarBackground = this.scene.add.rectangle(0, 0, HPBARWIDTH + hpBarBorder, hpBarHeight + hpBarBorder, 0x5a639e)
    hpBarBackground.setPosition(this.scene.scale.width * 0.5, this.scene.scale.height - hpBarOffsetY)
    this.playerHPBar = this.scene.add.rectangle(0, 0, HPBARWIDTH, hpBarHeight, HPCOLOR)
    Phaser.Display.Align.In.Center(this.playerHPBar, hpBarBackground)
    this.hPText = this.scene.add.bitmapText(0, 0, 'battery', `${this.currentHP} / ${this.maxHP}`, 30).setDepth(1)
    Phaser.Display.Align.In.Center(this.hPText, this.playerHPBar)
  }

  loadWeaponBar() {
    const weaponBarWidth = 195
    const weaponBarHeight = 40
    const weaponBarBorder = 5
    const weaponBoxWidth = 60
    const weaponBoxColor = 0xffff00
    const weaponBoxBorder = weaponBarBorder - 2

    let weaponBarOffsetY = (weaponBarHeight + weaponBarBorder) * 0.6

    let weaponBarBackground = this.scene.add.rectangle(
      0,
      0,
      weaponBarWidth + weaponBarBorder,
      weaponBarHeight + weaponBarBorder,
      0x5a639e
    )
    weaponBarBackground.setPosition(this.scene.scale.width * 0.21, this.scene.scale.height - weaponBarOffsetY)
    weaponBarBackground.isFilled = false
    weaponBarBackground.setStrokeStyle(weaponBarBorder, 0x5a639e)

    const box1 = this.scene.add.rectangle(0, 0, weaponBoxWidth, weaponBarHeight, 0xffff00).setAlpha(UIBOXALPHA)
    box1.isFilled = false
    box1.setStrokeStyle(weaponBoxBorder, weaponBoxColor)
    Phaser.Display.Align.In.LeftCenter(box1, weaponBarBackground, -weaponBarBorder)
    const box1Text = this.scene.add.text(0, 0, '1', { fontSize: '22px', color: '#000000' }).setDepth(1).setAngle(-20)
    Phaser.Display.Align.In.TopLeft(box1Text, box1)
    this.weaponUIBoxes[WEAPONNAMES[0]] = box1

    const box2 = this.scene.add.rectangle(0, 0, weaponBoxWidth, weaponBarHeight, 0xffff00).setAlpha(UIBOXALPHA)
    box2.isFilled = false
    box2.setStrokeStyle(weaponBoxBorder, weaponBoxColor)
    Phaser.Display.Align.In.LeftCenter(box2, weaponBarBackground, -weaponBarBorder * 2 - weaponBoxWidth)
    const box2Text = this.scene.add.text(0, 0, '2', { fontSize: '22px', color: '#000000' }).setDepth(1).setAngle(-20)
    Phaser.Display.Align.In.TopLeft(box2Text, box2)
    this.weaponUIBoxes[WEAPONNAMES[1]] = box2

    const box3 = this.scene.add.rectangle(0, 0, weaponBoxWidth, weaponBarHeight, 0xffff00).setAlpha(UIBOXALPHA)
    box3.isFilled = false
    box3.setStrokeStyle(weaponBoxBorder, weaponBoxColor)
    Phaser.Display.Align.In.LeftCenter(box3, weaponBarBackground, -weaponBarBorder * 3 - weaponBoxWidth * 2)
    const box3Text = this.scene.add.text(0, 0, '3', { fontSize: '22px', color: '#000000' }).setDepth(1).setAngle(-20)
    Phaser.Display.Align.In.TopLeft(box3Text, box3)
    this.weaponUIBoxes[WEAPONNAMES[2]] = box3
  }

  loadScreenText() {
    this.sceneAsRect = this.scene.add
      .rectangle(
        this.scene.scale.width * 0.5,
        this.scene.scale.height * 0.5,
        this.scene.scale.width,
        this.scene.scale.height
      )
      .setVisible(false)
    this.announcementText = this.scene.add.bitmapText(0, 0, 'battery', '', 30, 1).setDepth(1)
    Phaser.Display.Align.In.Center(this.announcementText, this.sceneAsRect)
    this.victoryText = this.scene.add.bitmapText(0, 0, 'battery', '', 40, 1).setDepth(1).setVisible(false)
    Phaser.Display.Align.In.Center(this.victoryText, this.sceneAsRect, 0, -100)
  }

  isAlive(): boolean {
    return this.alive
  }

  isRespawning(): boolean {
    return this.respawning
  }

  loadPotionBar() {
    const potionBarWidth = 70
    const potionBarHeight = 40
    const potionBarBorder = 5
    const potionBoxBorder = potionBarBorder - 2

    let potionBarOffsetY = (potionBarHeight + potionBarBorder) * 0.6

    let potionBarBackground = this.scene.add.rectangle(
      0,
      0,
      potionBarWidth + potionBarBorder,
      potionBarHeight + potionBarBorder,
      0x5a639e
    )
    potionBarBackground.setPosition(this.scene.scale.width * 0.7, this.scene.scale.height - potionBarOffsetY)
    potionBarBackground.isFilled = false
    potionBarBackground.setStrokeStyle(potionBarBorder, 0x5a639e)
    this.potionUIBox = this.scene.add.rectangle(0, 0, potionBarWidth, potionBarHeight, 0xffff00).setAlpha(UIBOXALPHA)
    Phaser.Display.Align.In.Center(this.potionUIBox, potionBarBackground)
    this.potionUIBox.isFilled = false
    this.potionUIBox.setStrokeStyle(potionBoxBorder, 0xffff00)
    const box1Text = this.scene.add.text(0, 0, '7', { fontSize: '22px', color: '#000000' }).setDepth(1).setAngle(-20)
    Phaser.Display.Align.In.TopLeft(box1Text, this.potionUIBox)
    this.potionCountText = this.scene.add.bitmapText(0, 0, 'battery', `${this.potionCount}`, 20).setDepth(1)
    Phaser.Display.Align.In.BottomRight(this.potionCountText, this.potionUIBox)
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
      .bitmapText(10, this.scene.scale.height - 40, 'battery', '0% Lit', 30)
      .setDepth(1)
  }

  litObject() {
    this.numLitObjs++
    const newLitTextPercent = Math.floor((this.numLitObjs / LIGHTUPPABLES) * 100)
    if (newLitTextPercent !== this.litTextPercent) {
      this.litTextPercent = newLitTextPercent

      this.scene.tweens.add({
        targets: this.percentLitText,
        ease: 'sine.inout',
        duration: 100,
        scale: 1.2,
        useFrames: false,
        yoyo: true,
        onComplete: () => {
          this.percentLitText.setText(`${newLitTextPercent}% Lit`)
        }
      })

      if (newLitTextPercent === 100) {
        this.audios['victory'].play()
      }
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
    this.expBar = this.scene.add.star(0, 0, 7, expInnerRadius, expOuterRadius, 0xffff00).setAlpha(0.9)
    Phaser.Display.Align.In.Center(this.expBar, expBarBackground)
    this.expText = this.scene.add.bitmapText(0, 0, 'battery', `Level ${this.currentLevel} \n 0.0%`, 20, 1).setDepth(1)
    Phaser.Display.Align.In.Center(this.expText, this.expBar)
    this.expBar.setScale(0)
  }

  setUpKeys() {
    // add keys
    this.keys = {
      w: this.scene.input.keyboard.addKey('w'),
      z: this.scene.input.keyboard.addKey('z'),
      a: this.scene.input.keyboard.addKey('a'),
      q: this.scene.input.keyboard.addKey('q'),
      s: this.scene.input.keyboard.addKey('s'),
      d: this.scene.input.keyboard.addKey('d'),
      interact: this.scene.input.keyboard.addKey('e'),
      slot1: this.scene.input.keyboard.addKey(49),
      slot2: this.scene.input.keyboard.addKey(50),
      slot3: this.scene.input.keyboard.addKey(51),
      slotHP: this.scene.input.keyboard.addKey(55),
      space: this.scene.input.keyboard.addKey(32),
      m: this.scene.input.keyboard.addKey('m')
    }

    this.keys.m.on('down', () => {
      if (this.scene.sound.mute) {
        this.muteText.setText('')
      } else {
        this.muteText.setText('Game muted')
      }
      this.scene.sound.mute = !this.scene.sound.mute
    })
  }

  loadCrossHair() {
    // add blue dot cross hair
    this.crossHair = this.scene.add.circle(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height / 2,
      4,
      0x0000ee
    )
    this.crossHair.depth = 2
  }

  bossFight() {
    if (this.audios['background'].isPlaying) {
      this.audios['background'].stop()
    }
    if (!this.audios['boss'].isPlaying) this.audios['boss'].play()
  }

  createShopWeapons() {
    // TODO messy creating shop weapons called inside player load
    const weaponSpawnPos: THREE.Vector3[] = [
      // first one is dummy
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(5.5, -1, 45),
      new THREE.Vector3(5.5, -1, 50)
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
    this.createWeapon3DUIs()
  }

  createWeapon3DUIs() {
    for (let i = 0; i < WEAPONNAMES.length; i++) {
      const weaponName = WEAPONNAMES[i]
      this.uI3DObjs[weaponName] = new UI3DObj(
        this.scene,
        this.weaponUIBoxes[weaponName],
        this.weapons[weaponName].weapon
      )
      this.uI3DObjsKeys.push(weaponName)
    }
    // make first weapon visible and active
    this.uI3DObjs[WEAPONNAMES[0]].setScale(ACTIVEWEPSCALE3DUI)
    this.uI3DObjs[WEAPONNAMES[0]].setVisibility(true)
  }

  jump() {
    this.anims.play('jumping', 0, false)
    this.body.setVelocityY(5) // TODO maybe set back to applyforce but sorta had inconsistent jumps on different frame rates
  }

  respawn() {
    this.audios['background'].play()
    this.respawning = true
    setTimeout(() => {
      this.respawning = false
    }, 100)
    this.currentHP = 20
    this.updateHPUI()
    // set body to be kinematic
    this.body.setCollisionFlags(2)

    // set the new position
    this.position.set(0, 4, 0)
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

  updateExpUI() {
    const newExpBarScale = this.currentExp / this.expNextLevel
    const percentExpText = (newExpBarScale * 100).toFixed(1)
    this.expBar.setScale(newExpBarScale)
    this.expText.setText(`Level ${this.currentLevel} \n ${percentExpText}%`)
  }

  playBossVictorySequence() {
    const winText = [
      'Congrats! You defeated the power hungry king!',
      'He was draining the power from the world \n to power his 64K TV!',
      'You have now unlocked inifite jump. \n Feel free to checkout the lands you have repowered.',
      'Thanks for playing!'
    ]

    const delayBetweenText = 8000

    this.audios['victory'].play()

    const winTimeout = (index: number) => {
      if (index < winText.length) {
        if (index === 1) {
          this.scene.third.physics.add
            .box(
              {
                x: 120,
                y: 3,
                z: 115.5,
                width: 10,
                height: 8,
                depth: 1
              },
              {
                lambert: { color: 'black' }
              }
            )
            .rotateY(0.79)
          this.infiJump = true
        }

        this.victoryText.setText(winText[index]).setVisible(true)
        Phaser.Display.Align.In.Center(this.victoryText, this.sceneAsRect, 0, -100)

        setTimeout(() => {
          winTimeout(++index)
        }, delayBetweenText)
      } else {
        this.victoryText.setVisible(false)
        this.audios['boss'].stop()
        this.audios['background'].play()
      }
    }

    setTimeout(() => {
      winTimeout(0)
    }, 130)
  }

  levelUp() {
    this.isLevelingUp = true
    this.audios['levelup'].play()
    this.scene.tweens.add({
      targets: this.expBar,
      ease: 'sine.inout',
      duration: 130,
      angle: 360,
      scale: 1.2,
      useFrames: false,
      yoyo: true,
      onComplete: () => {
        this.currentLevel++
        this.currentExp -= this.expNextLevel
        this.expNextLevel += EXPNEXTLEVELINCREMENTAMT
        this.updateExpUI()
        const addedHP = Math.floor(this.maxHP * 1.1) - this.maxHP
        this.maxHP += addedHP
        this.currentHP += addedHP
        this.updateHPUI()
        this.dmgFactor *= 1.1
        this.isLevelingUp = false
      }
    })

    this.announcementText.setText('HP +10% \n DMG +10%').setAlpha(1)
    Phaser.Display.Align.In.Center(this.announcementText, this.sceneAsRect)
    this.scene.tweens.add({
      targets: this.announcementText,
      ease: 'sine.inout',
      duration: 1000,
      alpha: 0,
      y: this.announcementText.y - 100
    })
  }

  tookDamage(dmg: number) {
    if (this.alive === false) return
    this.currentHP -= dmg
    if (this.currentHP <= 0) {
      this.currentHP = 0
      this.die()
    }
    this.updateHPUI()
  }

  die() {
    this.alive = false
    let countDownNum = 3
    this.anims.play('dying', 0, false)
    this.audios['background'].stop()
    this.audios['boss'].stop()
    // respawn after some time
    this.announcementText.setText('You Died...').setAlpha(1)
    Phaser.Display.Align.In.Center(this.announcementText, this.sceneAsRect)

    this.scene.tweens.add({
      targets: this.announcementText,
      ease: 'sine.inout',
      duration: PLAYERRESPAWNTIME / 3,
      alpha: 0,
      repeat: 3,
      onRepeat: () => {
        this.announcementText.setText(`Respawning in... ${countDownNum}`).setAlpha(1)
        Phaser.Display.Align.In.Center(this.announcementText, this.sceneAsRect)
        countDownNum--
      },
      onComplete: () => {
        this.alive = true
        this.respawn()
      }
    })
  }

  swapToWeapon(weaponName: string) {
    if (this.weapons[weaponName].canSwapTo()) {
      this.uI3DObjs[this.activeWeapon.weaponData.name].setScale(0.05)
      this.uI3DObjs[weaponName].setScale(0.1)
      this.activeWeapon.weapon.visible = false
      this.activeWeapon = this.weapons[weaponName]
      this.activeWeapon.weapon.visible = true
    }
  }

  goOnCooldown(weaponName: string) {
    this.anims.play('attacking', 0, false)
    const wepAudioNum = Math.floor(getRandomBetween(1, 4))
    this.audios[`wep${wepAudioNum}`].play()
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

  goOnDrinkCooldown() {
    this.canDrink = false
    this.audios['drink'].play()
    this.potionUIBox.setAlpha(0)
    this.scene.tweens.add({
      targets: this.potionUIBox,
      duration: DRINKCD,
      alpha: UIBOXALPHA,
      onComplete: () => {
        this.canDrink = true
        this.scene.tweens.add({
          targets: this.potionUIBox,
          duration: 100,
          scale: 1.1,
          yoyo: true
        })
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
      this.audios['coin'].play()
    } else if (itemType === ItemTypes.EXP) {
      this.currentExp++
      const expAudioNum = Math.floor(getRandomBetween(1, 3))
      this.audios[`exp${expAudioNum}`].play()
      if (this.currentExp >= this.expNextLevel && !this.isLevelingUp) {
        this.levelUp()
      } else {
        this.updateExpUI()
      }
    }
  }

  usePotion() {
    if (!this.canDrink) return
    if (this.potionCount > 0) {
      this.currentHP += POTIONHEALAMT
      this.potionCount--
      if (this.currentHP > this.maxHP) {
        this.currentHP = this.maxHP
      }
      this.updateHPUI()
      this.potionCountText.setText(`${this.potionCount}`)
      Phaser.Display.Align.In.BottomRight(this.potionCountText, this.potionUIBox)
      if (this.potionCount < 1) {
        this.uI3DObjs[POTION.name].setVisibility(false)
      }
      this.goOnDrinkCooldown()
    }
  }

  getCoinDiff(shopItemData: ShopItemData): number {
    return shopItemData.cost - this.coinCount
  }

  purchaseItem(shopItemData: ShopItemData) {
    const shopItemName = shopItemData.name
    this.coinCount -= shopItemData.cost
    this.audios['buy'].play()
    this.coinCountText.setText(`${this.coinCount}`)
    if (shopItemName === POTION.name) {
      this.potionCount++
      this.potionCountText.setText(`${this.potionCount}`)
      this.uI3DObjs[POTION.name].setVisibility(true)
    } else if (this.weapons[shopItemName] !== undefined) {
      this.weapons[shopItemName].weaponData.isUnlocked = true
      // show it in ui bar
      this.uI3DObjs[shopItemName].setVisibility(true)
    }
  }

  // called by scene's update - player movement and actions
  update(time: number, delta: number) {
    if (!this.body || !this.controls) {
      return
    }
    if (!this.alive) return
    this.setAnim = false
    const direction = new THREE.Vector3()
    const rotation = this.scene.third.camera.getWorldDirection(direction)
    const theta = Math.atan2(rotation.x, rotation.z)
    const rotationPlayer = this.getWorldDirection(direction)
    const thetaPlayer = Math.atan2(rotationPlayer.x, rotationPlayer.z)
    this.body.setAngularVelocityY(0)

    const l = Math.abs(theta - thetaPlayer)
    let rotationSpeed = 5

    if (l > ROTDIFF) {
      if (l > PIMINUSROTDIFF) rotationSpeed *= -1
      if (theta < thetaPlayer) rotationSpeed *= -1
      this.body.setAngularVelocityY(rotationSpeed)
    }

    // move forwards and backwards
    if (this.keys.w.isDown || this.keys.z.isDown) {
      if (this.anims.current === 'running') this.setAnim = true
      if (this.anims.current !== 'running' && !this.setAnim) {
        this.anims.play('running')
        this.setAnim = true
      }
      let x = Math.sin(theta) * this.speed
      let y = this.body.velocity.y
      let z = Math.cos(theta) * this.speed
      this.body.setVelocity(x, y, z)
      // console.log(`${x}, ${y}, ${z}`)
    } else if (this.keys.s.isDown) {
      if (this.anims.current === 'running') this.setAnim = true
      if (this.anims.current !== 'running' && !this.setAnim) {
        this.anims.play('running')
        this.setAnim = true
      }
      let halfSpeed = this.speed * 0.5
      let x = Math.sin(theta) * halfSpeed
      let y = this.body.velocity.y
      let z = Math.cos(theta) * halfSpeed
      this.body.setVelocity(-x, y, -z)
    }

    // move sideways
    if (this.keys.a.isDown || this.keys.q.isDown) {
      if (this.anims.current === 'running') this.setAnim = true
      if (this.anims.current !== 'running' && !this.setAnim) {
        this.anims.play('running')
        this.setAnim = true
      }
      let x = Math.sin(theta + HALFPI) * this.speed
      let y = this.body.velocity.y
      let z = Math.cos(theta + HALFPI) * this.speed
      this.body.setVelocity(x, y, z)
    } else if (this.keys.d.isDown) {
      if (this.anims.current === 'running') this.setAnim = true
      if (this.anims.current !== 'running' && !this.setAnim) {
        this.anims.play('running')
        this.setAnim = true
      }
      let x = Math.sin(theta - HALFPI) * this.speed
      let y = this.body.velocity.y
      let z = Math.cos(theta - HALFPI) * this.speed
      this.body.setVelocity(x, y, z)
    } else {
      if (this.anims.current === 'idle') this.setAnim = true
      if (this.anims.current !== 'idle' && !this.setAnim) {
        this.anims.play('idle', 0)
        this.setAnim = true
      }
    }

    if (this.keys.space.isDown && this.canJump) {
      this.jump()
    }

    if (this.position.y < OUTOFBOUNDSY) {
      this.respawn()
    }

    if (this.scene.input.mousePointer.leftButtonDown()) {
      this.activeWeapon.useWeapon()
    }

    for (let uiKey of this.uI3DObjsKeys) {
      this.uI3DObjs[uiKey].update(time, delta)
    }
  }
}
