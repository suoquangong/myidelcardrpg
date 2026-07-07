export type CardRole = 'tank' | 'damage' | 'support';

export interface SkillDefinition {
  name: string;
  cooldown: number;
  summary: string;
}

export interface CardDefinition {
  id: string;
  name: string;
  role: CardRole;
  baseHealth: number;
  baseAttack: number;
  unlockStage: number;
  skill: SkillDefinition;
}

export interface StageDefinition {
  id: number;
  enemyName: string;
  enemyHealth: number;
  enemyAttack: number;
}

export interface StageProgressSummary {
  currentStage: number;
  totalStages: number;
  clearedStages: number;
  chapterIndex: number;
  chapterName: string;
  progressPercent: number;
  isComplete: boolean;
}

export interface IdleRewardSummary {
  claimableGold: number;
  goldPerMinute: number;
  capMinutes: number;
  storedMinutes: number;
}

export interface CardStats {
  health: number;
  attack: number;
}

export type BattleEventKind =
  | 'playerAttack'
  | 'skill'
  | 'shield'
  | 'heal'
  | 'enemyAttack'
  | 'victory'
  | 'defeat';

export interface BattleEvent {
  round: number;
  kind: BattleEventKind;
  sourceID?: string;
  sourceName: string;
  message: string;
  amount: number;
  playerHealthRemaining: number;
  enemyHealthRemaining: number;
}

export interface BattleResult {
  stageID: number;
  enemyName: string;
  victory: boolean;
  playerHealth: number;
  playerAttack: number;
  enemyHealth: number;
  enemyAttack: number;
  playerHealthRemaining: number;
  enemyHealthRemaining: number;
  skillTriggers: number;
  skillDamage: number;
  skillHealing: number;
  skillProtection: number;
  skillCallouts: string[];
  events: BattleEvent[];
}

export type ChallengeReadiness = 'favored' | 'even' | 'risky';

export interface UpgradeRecommendation {
  cardID: string;
  cardName: string;
  currentLevel: number;
  cost: number;
  powerGain: number;
  canAfford: boolean;
  reason: string;
}

export interface GameState {
  gold: number;
  highestClearedStage: number;
  lastIdleClaimAt: number;
  cardLevels: Record<string, number>;
  unlockedCardIDs: string[];
  lineupCardIDs: string[];
}

export class GameRuleError extends Error {
  constructor(public readonly code: 'cardUnknown' | 'cardLocked' | 'insufficientGold' | 'lineupFull' | 'invalidLineup') {
    super(code);
  }
}
