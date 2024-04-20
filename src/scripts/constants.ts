import Player from './player'
import { WeaponData } from './weapon'

export const PLAYERREF: { player: Player | null } = { player: null }

export const ZAP = 'zap'

export const COIN = 'coin'

export const GROUNDTWEENDUR = 500

export const IFRAMES = 30

export const HALFPI = Math.PI * 0.5

const SINGLESHOT: WeaponData = {
  damage: 5,
  cooldown: 5,
  range: 5,
  spread: 5,
  shotNum: 1,
  force: 5,
  isUnlocked: true
}

const SHOTTY: WeaponData = {
  damage: 5,
  cooldown: 5,
  range: 5,
  spread: 5,
  shotNum: 3,
  force: 5,
  isUnlocked: false
}

const RAPID: WeaponData = {
  damage: 5,
  cooldown: 5,
  range: 5,
  spread: 5,
  shotNum: 1,
  force: 5,
  isUnlocked: false
}

// order here dictates slot order
export const WEAPONS = {
  SingleShot: SINGLESHOT,
  Shotty: SHOTTY,
  Rapid: RAPID
}

export const WEAPONNAMES = Object.keys(WEAPONS)
