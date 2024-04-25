import { MonsterStates } from './monster'

export interface MonsterData {
  damage: number
  maxHP: number
  respawnTime: number
  expAmount: number
  coinAmount: number
  speed: number
  canJump: boolean
  jumpCooldown: number
  prevJumpTime: number
  currentState: MonsterStates
  prevDmgTime: number
  dmgCooldown: number
  specialCooldown: number
  prevSpecialTime: number
  prevProjectileTime: number
  projectileCooldown: number
  xRange?: number[] // static detection area
  zRange?: number[]
}

export const MONSTERTESTDATA: MonsterData = {
  damage: 5,
  maxHP: 100,
  respawnTime: 1000,
  expAmount: 2,
  coinAmount: 2,
  speed: 2,
  canJump: false,
  jumpCooldown: 2000,
  prevJumpTime: 0,
  currentState: MonsterStates.BossIdle,
  prevDmgTime: 0,
  dmgCooldown: 200,
  specialCooldown: 5500,
  prevSpecialTime: 0,
  prevProjectileTime: 0,
  projectileCooldown: 2500,
  xRange: [25, 60],
  zRange: [25, 60]
}

export const MONSTERKNIGHTDATA: MonsterData = {
  damage: 5,
  maxHP: 100,
  respawnTime: 25000,
  expAmount: 2,
  coinAmount: 2,
  speed: 1.5,
  canJump: false,
  jumpCooldown: 1700,
  prevJumpTime: 0,
  currentState: MonsterStates.Idle,
  prevDmgTime: 0,
  dmgCooldown: 200,
  // bottom special and projectile dont matter for knight
  specialCooldown: 6000,
  prevSpecialTime: 0,
  prevProjectileTime: 0,
  projectileCooldown: 3000
}

export const MONSTERBISHOPDATA: MonsterData = {
  damage: 8,
  maxHP: 150,
  respawnTime: 40000,
  expAmount: 4,
  coinAmount: 4,
  speed: 1.5,
  canJump: false,
  jumpCooldown: 2000,
  prevJumpTime: 0,
  currentState: MonsterStates.Idle,
  prevDmgTime: 0,
  dmgCooldown: 200,
  // special values don't matter for bishop
  specialCooldown: 6000,
  prevSpecialTime: 0,
  prevProjectileTime: 0,
  projectileCooldown: 3000
}

export const MONSTERROOKDATA: MonsterData = {
  damage: 10,
  maxHP: 200,
  respawnTime: 50000,
  expAmount: 8,
  coinAmount: 8,
  speed: 1.5,
  canJump: false,
  jumpCooldown: 1900,
  prevJumpTime: 0,
  currentState: MonsterStates.Idle,
  prevDmgTime: 0,
  dmgCooldown: 200,
  specialCooldown: 6000,
  prevSpecialTime: 0,
  // bottom projectile values don't matter for rook
  prevProjectileTime: 0,
  projectileCooldown: 3000
}

export const MONSTERBOSSDATA: MonsterData = {
  damage: 14,
  maxHP: 1000,
  respawnTime: 1200000,
  expAmount: 50,
  coinAmount: 50,
  speed: 2,
  canJump: false,
  jumpCooldown: 2000,
  prevJumpTime: 0,
  currentState: MonsterStates.BossIdle,
  prevDmgTime: 0,
  dmgCooldown: 200,
  specialCooldown: 5500,
  prevSpecialTime: 0,
  prevProjectileTime: 0,
  projectileCooldown: 2500,
  xRange: [114.6, 127.5],
  zRange: [109.5, 122]
}
