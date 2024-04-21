import Player from './player'

export const PLAYERREF: { player: Player | null } = { player: null }

export const ZAP = 'zap'

export const COIN = 'coin'

export const GROUNDTWEENDUR = 500

export const IFRAMES = 30

export const HALFPI = Math.PI * 0.5

export const HPBARWIDTH = 400

export const POTIONHEALAMT = 20

export const OUTOFBOUNDSY = -10

export const UIBOXALPHA = 0.7

// ground + npcs + environments
export const LIGHTUPPABLES = 901

export enum ZapIMG {
  ZAP = 'zap',
  ZAP2 = 'zap2'
}

export interface ShopItemData {
  cost: number
  shopText: string
  name: string
  // ms time to restock
  restockTime?: number
}
export interface WeaponData extends ShopItemData {
  damage: number
  cooldown: number
  duration: number
  spread: boolean
  shotNum: number
  force: number
  isUnlocked: boolean
  cost: number
  zapImg: ZapIMG[]
  recoil: number
}

const SINGLESHOT: WeaponData = {
  damage: 9,
  cooldown: 500,
  duration: 7,
  spread: false,
  shotNum: 1,
  force: 10,
  isUnlocked: true,
  cost: 0,
  shopText: 'starter wand no one will read this',
  name: 'SingleShot',
  zapImg: [ZapIMG.ZAP],
  recoil: 0
}

const SHOTTY: WeaponData = {
  damage: 8,
  cooldown: 800,
  duration: 5,
  spread: true, // if spread true have to lower force a bunch else it gets launched
  shotNum: 8,
  force: 2,
  isUnlocked: true, // todo
  cost: 42,
  shopText: 'Shotty with a short range zone of destruction',
  name: 'Shotty',
  zapImg: [ZapIMG.ZAP, ZapIMG.ZAP2],
  recoil: 2
}

const RAPID: WeaponData = {
  damage: 10,
  cooldown: 250,
  duration: 7,
  spread: false,
  shotNum: 1,
  force: 13,
  isUnlocked: true, //todo
  cost: 88,
  shopText: 'AK-40-Wand that goes pew pew',
  name: 'Rapid',
  zapImg: [ZapIMG.ZAP2],
  recoil: 1
}

// order here dictates slot order
export const WEAPONS = {
  // key names here same as glb model name and also same as weapondata above
  // because I set this up weirdly
  SingleShot: SINGLESHOT,
  Shotty: SHOTTY,
  Rapid: RAPID
}

export const WEAPONNAMES = Object.keys(WEAPONS)

export const POTION: ShopItemData = {
  cost: 5,
  shopText: `A potion that restores ${POTIONHEALAMT} HP`,
  name: 'Potion',
  restockTime: 1000
}
