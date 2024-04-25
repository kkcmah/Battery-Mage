import { ZapIMG } from '../constants'

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' })
  }

  preload() {
    // font created from snowb.org
    this.load.bitmapFont('battery', 'assets/fonts/battery-font.png', 'assets/fonts/battery-font.xml')
    this.load.image(ZapIMG.ZAP, 'assets/img/BatteryMageZap.png')
    this.load.image(ZapIMG.ZAP2, 'assets/img/BatteryMageZap2.png')
    // audio
    this.load.audio('background', ['assets/audio/background.ogg', 'assets/audio/background.mp3'])
    this.load.audio('boss', ['assets/audio/boss.ogg', 'assets/audio/boss.mp3'])
    this.load.audio('wep1', ['assets/audio/wep1.ogg', 'assets/audio/wep1.mp3'])
    this.load.audio('wep2', ['assets/audio/wep2.ogg', 'assets/audio/wep2.mp3'])
    this.load.audio('wep3', ['assets/audio/wep3.ogg', 'assets/audio/wep3.mp3'])
    this.load.audio('coin', ['assets/audio/coin.ogg', 'assets/audio/coin.mp3'])
    this.load.audio('exp1', ['assets/audio/exp1.ogg', 'assets/audio/exp1.mp3'])
    this.load.audio('exp2', ['assets/audio/exp2.ogg', 'assets/audio/exp2.mp3'])
    this.load.audio('levelup', ['assets/audio/levelup.ogg', 'assets/audio/levelup.mp3'])
    this.load.audio('victory', ['assets/audio/victory.ogg', 'assets/audio/victory.mp3'])
    this.load.audio('drink', ['assets/audio/drink.ogg', 'assets/audio/drink.mp3'])
    this.load.audio('buy', ['assets/audio/buy.ogg', 'assets/audio/buy.mp3'])
  }

  create() {
    this.scene.start('MainScene')

    /**
     * This is how you would dynamically import the mainScene class (with code splitting),
     * add the mainScene to the Scene Manager
     * and start the scene.
     * The name of the chunk would be 'mainScene.chunk.js
     * Find more about code splitting here: https://webpack.js.org/guides/code-splitting/
     */
    // let someCondition = true
    // if (someCondition)
    //   import(/* webpackChunkName: "mainScene" */ './mainScene').then(mainScene => {
    //     this.scene.add('MainScene', mainScene.default, true)
    //   })
    // else console.log('The mainScene class will not even be loaded by the browser')
  }
}
