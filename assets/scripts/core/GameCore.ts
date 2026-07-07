import { CARD_DEFINITIONS, STAGE_DEFINITIONS } from './DefaultGameData';
import {
  BattleEvent,
  BattleResult,
  CardDefinition,
  CardStats,
  ChallengeReadiness,
  GameRuleError,
  GameState,
  IdleRewardSummary,
  StageDefinition,
  StageProgressSummary,
  UpgradeRecommendation,
} from './GameTypes';

export class GameCore {
  static readonly cards: CardDefinition[] = CARD_DEFINITIONS;
  static readonly stages: StageDefinition[] = STAGE_DEFINITIONS;
  static readonly idleRewardCapMinutes = 12 * 60;
  private static readonly chapterSize = 5;
  private static readonly chapterNames = ['晨曦林地', '碎星边境', '王城遗迹', '虚空高塔'];

  static newGame(now = Date.now()): GameState {
    const unlocked = this.cards.filter((card) => card.unlockStage === 0).map((card) => card.id);
    return {
      gold: 120,
      highestClearedStage: 0,
      lastIdleClaimAt: now,
      cardLevels: unlocked.reduce<Record<string, number>>((levels, cardID) => {
        levels[cardID] = 1;
        return levels;
      }, {}),
      unlockedCardIDs: unlocked,
      lineupCardIDs: unlocked.slice(0, 3),
    };
  }

  static currentStage(state: GameState): number {
    return Math.min(state.highestClearedStage + 1, this.stages.length);
  }

  static currentStageDefinition(state: GameState): StageDefinition | undefined {
    return this.stages.find((stage) => stage.id === this.currentStage(state));
  }

  static stageProgress(state: GameState): StageProgressSummary {
    const totalStages = this.stages.length;
    const clearedStages = Math.min(state.highestClearedStage, totalStages);
    const currentStage = Math.min(clearedStages + 1, totalStages);
    const chapterIndex = Math.max(0, Math.ceil(currentStage / this.chapterSize) - 1);
    const chapterName = this.chapterNames[chapterIndex] ?? `第 ${chapterIndex + 1} 章`;

    return {
      currentStage,
      totalStages,
      clearedStages,
      chapterIndex,
      chapterName,
      progressPercent: totalStages > 0 ? Math.floor((clearedStages / totalStages) * 100) : 100,
      isComplete: clearedStages >= totalStages,
    };
  }

  static unlockedCards(state: GameState): CardDefinition[] {
    return this.cards.filter((card) => state.unlockedCardIDs.includes(card.id));
  }

  static nextUnlock(state: GameState): CardDefinition | undefined {
    return this.cards
      .filter((card) => !state.unlockedCardIDs.includes(card.id))
      .sort((left, right) => left.unlockStage - right.unlockStage)[0];
  }

  static repairedLineupIDs(state: GameState): string[] {
    const unlocked = this.unlockedCards(state).map((card) => card.id);
    const repaired: string[] = [];

    for (const cardID of state.lineupCardIDs) {
      if (unlocked.includes(cardID) && !repaired.includes(cardID)) {
        repaired.push(cardID);
      }
    }

    for (const cardID of unlocked) {
      if (repaired.length >= 3) {
        break;
      }
      if (!repaired.includes(cardID)) {
        repaired.push(cardID);
      }
    }

    return repaired.slice(0, 3);
  }

  static repairLineup(state: GameState): void {
    state.lineupCardIDs = this.repairedLineupIDs(state);
  }

  static toggleLineupCard(cardID: string, state: GameState): void {
    if (!this.cards.some((card) => card.id === cardID)) {
      throw new GameRuleError('cardUnknown');
    }
    if (!state.unlockedCardIDs.includes(cardID)) {
      throw new GameRuleError('cardLocked');
    }

    const index = state.lineupCardIDs.indexOf(cardID);
    if (index >= 0) {
      state.lineupCardIDs.splice(index, 1);
      return;
    }

    if (state.lineupCardIDs.length >= 3) {
      throw new GameRuleError('lineupFull');
    }
    state.lineupCardIDs.push(cardID);
  }

  static stats(cardID: string, state: GameState): CardStats | undefined {
    const card = this.cards.find((item) => item.id === cardID);
    if (!card) {
      return undefined;
    }
    const level = state.cardLevels[cardID] ?? 1;
    return {
      health: card.baseHealth + (level - 1) * 30,
      attack: card.baseAttack + (level - 1) * 8,
    };
  }

  static upgradeCost(cardID: string, state: GameState): number {
    return (state.cardLevels[cardID] ?? 1) * 40;
  }

  static battlePower(cardID: string, state: GameState): number | undefined {
    const stats = this.stats(cardID, state);
    if (!stats) {
      return undefined;
    }
    return stats.health + stats.attack * 4;
  }

  static lineupBattlePower(state: GameState): number {
    return this.repairedLineupIDs(state).reduce((total, cardID) => total + (this.battlePower(cardID, state) ?? 0), 0);
  }

  static recommendedPower(stage: StageDefinition): number {
    return Math.max(120, Math.floor(stage.enemyHealth / 2) + stage.enemyAttack * 9 + stage.id * 8);
  }

  static readiness(state: GameState): ChallengeReadiness {
    const stage = this.currentStageDefinition(state);
    if (!stage) {
      return 'favored';
    }

    const power = this.lineupBattlePower(state);
    const recommended = this.recommendedPower(stage);
    if (power >= Math.floor(recommended * 1.1)) {
      return 'favored';
    }
    if (power >= Math.floor(recommended * 0.85)) {
      return 'even';
    }
    return 'risky';
  }

  static bestUpgradeRecommendation(state: GameState): UpgradeRecommendation | undefined {
    const lineup = new Set(this.repairedLineupIDs(state));
    return this.unlockedCards(state)
      .map((card): UpgradeRecommendation | undefined => {
        const currentPower = this.battlePower(card.id, state);
        if (currentPower === undefined) {
          return undefined;
        }

        const upgradedState = this.cloneState(state);
        upgradedState.cardLevels[card.id] = (upgradedState.cardLevels[card.id] ?? 1) + 1;
        const upgradedPower = this.battlePower(card.id, upgradedState);
        if (upgradedPower === undefined) {
          return undefined;
        }

        const cost = this.upgradeCost(card.id, state);
        return {
          cardID: card.id,
          cardName: card.name,
          currentLevel: state.cardLevels[card.id] ?? 1,
          cost,
          powerGain: upgradedPower - currentPower,
          canAfford: state.gold >= cost,
          reason: lineup.has(card.id) ? '主力阵容升级收益最快' : '低成本补强可提升阵容选择',
        };
      })
      .filter((item): item is UpgradeRecommendation => item !== undefined)
      .sort((left, right) => {
        if (left.canAfford !== right.canAfford) {
          return left.canAfford ? -1 : 1;
        }
        const leftInLineup = lineup.has(left.cardID);
        const rightInLineup = lineup.has(right.cardID);
        if (leftInLineup !== rightInLineup) {
          return leftInLineup ? -1 : 1;
        }
        if (left.cost !== right.cost) {
          return left.cost - right.cost;
        }
        return right.powerGain - left.powerGain;
      })[0];
  }

  static upgradeCard(cardID: string, state: GameState): void {
    if (!this.cards.some((card) => card.id === cardID)) {
      throw new GameRuleError('cardUnknown');
    }
    if (!state.unlockedCardIDs.includes(cardID)) {
      throw new GameRuleError('cardLocked');
    }

    const cost = this.upgradeCost(cardID, state);
    if (state.gold < cost) {
      throw new GameRuleError('insufficientGold');
    }

    state.gold -= cost;
    state.cardLevels[cardID] = (state.cardLevels[cardID] ?? 1) + 1;
  }

  static idleGoldPerMinute(state: GameState): number {
    return 5 + state.highestClearedStage * 2;
  }

  static idleRewards(now: number, state: GameState): number {
    const elapsedSeconds = Math.max(0, Math.floor((now - state.lastIdleClaimAt) / 1000));
    const cappedMinutes = Math.min(Math.floor(elapsedSeconds / 60), this.idleRewardCapMinutes);
    return cappedMinutes * this.idleGoldPerMinute(state);
  }

  static idleRewardSummary(now: number, state: GameState): IdleRewardSummary {
    const elapsedSeconds = Math.max(0, Math.floor((now - state.lastIdleClaimAt) / 1000));
    const storedMinutes = Math.min(Math.floor(elapsedSeconds / 60), this.idleRewardCapMinutes);

    return {
      claimableGold: storedMinutes * this.idleGoldPerMinute(state),
      goldPerMinute: this.idleGoldPerMinute(state),
      capMinutes: this.idleRewardCapMinutes,
      storedMinutes,
    };
  }

  static claimIdleRewards(now: number, state: GameState): number {
    const reward = this.idleRewards(now, state);
    if (reward <= 0) {
      return 0;
    }

    state.gold += reward;
    state.lastIdleClaimAt = now;
    return reward;
  }

  static resolveAutoBattle(state: GameState): BattleResult {
    this.repairLineup(state);
    if (state.lineupCardIDs.length !== 3) {
      throw new GameRuleError('invalidLineup');
    }

    const stage = this.stages.find((item) => item.id === this.currentStage(state));
    if (!stage) {
      throw new GameRuleError('invalidLineup');
    }

    const lineup = state.lineupCardIDs
      .map((cardID) => this.cards.find((card) => card.id === cardID))
      .filter((card): card is CardDefinition => card !== undefined);
    const lineupStats = lineup
      .map((card) => this.stats(card.id, state))
      .filter((stats): stats is CardStats => stats !== undefined);

    const playerHealth = lineupStats.reduce((total, stats) => total + stats.health, 0);
    const playerAttack = lineupStats.reduce((total, stats) => total + stats.attack, 0);
    let remainingPlayerHealth = playerHealth;
    let remainingEnemyHealth = stage.enemyHealth;
    let skillTriggers = 0;
    let skillDamage = 0;
    let skillHealing = 0;
    let skillProtection = 0;
    const skillCallouts: string[] = [];
    const events: BattleEvent[] = [];

    for (let round = 1; round <= 30 && remainingPlayerHealth > 0 && remainingEnemyHealth > 0; round += 1) {
      let roundDamage = playerAttack;
      let roundHealing = 0;
      let roundProtection = 0;

      for (const card of lineup) {
        if (round % card.skill.cooldown !== 0) {
          continue;
        }
        const cardStats = this.stats(card.id, state);
        if (!cardStats) {
          continue;
        }

        skillTriggers += 1;
        if (skillCallouts.length < 6) {
          skillCallouts.push(card.skill.name);
        }

        if (card.role === 'tank') {
          const protection = Math.max(10, Math.floor(cardStats.health / 5));
          roundProtection += protection;
          skillProtection += protection;
          events.push(this.event(round, 'shield', card.id, card.name, `${card.skill.name} 抵挡 ${protection} 伤害`, protection, remainingPlayerHealth, remainingEnemyHealth));
        } else if (card.role === 'damage') {
          const damage = cardStats.attack;
          roundDamage += damage;
          skillDamage += damage;
          events.push(this.event(round, 'skill', card.id, card.name, `${card.skill.name} 追加 ${damage} 伤害`, damage, remainingPlayerHealth, remainingEnemyHealth));
        } else {
          const healing = Math.max(12, Math.floor(cardStats.health / 4));
          roundHealing += healing;
          skillHealing += healing;
          events.push(this.event(round, 'heal', card.id, card.name, `${card.skill.name} 准备治疗 ${healing}`, healing, remainingPlayerHealth, remainingEnemyHealth));
        }
      }

      remainingEnemyHealth -= roundDamage;
      events.push(this.event(round, 'playerAttack', undefined, '阵容', `阵容造成 ${roundDamage} 伤害`, roundDamage, remainingPlayerHealth, remainingEnemyHealth));
      if (remainingEnemyHealth <= 0) {
        break;
      }

      const enemyDamage = Math.max(1, stage.enemyAttack - roundProtection);
      remainingPlayerHealth -= enemyDamage;
      events.push(this.event(round, 'enemyAttack', undefined, stage.enemyName, `${stage.enemyName} 反击 ${enemyDamage} 伤害`, enemyDamage, remainingPlayerHealth, remainingEnemyHealth));

      if (roundHealing > 0 && remainingPlayerHealth > 0) {
        const beforeHealing = remainingPlayerHealth;
        remainingPlayerHealth = Math.min(playerHealth, remainingPlayerHealth + roundHealing);
        events.push(this.event(round, 'heal', undefined, '阵容', `阵容恢复 ${remainingPlayerHealth - beforeHealing} 生命`, remainingPlayerHealth - beforeHealing, remainingPlayerHealth, remainingEnemyHealth));
      }
    }

    const victory = remainingEnemyHealth <= 0;
    events.push(this.event(events[events.length - 1]?.round ?? 0, victory ? 'victory' : 'defeat', undefined, victory ? '胜利' : '失败', victory ? '挑战胜利，关卡推进' : '挑战失败，升级后再试', 0, remainingPlayerHealth, remainingEnemyHealth));

    if (victory) {
      state.highestClearedStage = Math.max(state.highestClearedStage, stage.id);
      this.syncUnlockedCards(state);
    }

    return {
      stageID: stage.id,
      enemyName: stage.enemyName,
      victory,
      playerHealth,
      playerAttack,
      enemyHealth: stage.enemyHealth,
      enemyAttack: stage.enemyAttack,
      playerHealthRemaining: Math.max(0, remainingPlayerHealth),
      enemyHealthRemaining: Math.max(0, remainingEnemyHealth),
      skillTriggers,
      skillDamage,
      skillHealing,
      skillProtection,
      skillCallouts,
      events,
    };
  }

  static cloneState(state: GameState): GameState {
    return {
      gold: state.gold,
      highestClearedStage: state.highestClearedStage,
      lastIdleClaimAt: state.lastIdleClaimAt,
      cardLevels: { ...state.cardLevels },
      unlockedCardIDs: [...state.unlockedCardIDs],
      lineupCardIDs: [...state.lineupCardIDs],
    };
  }

  private static syncUnlockedCards(state: GameState): void {
    for (const card of this.cards) {
      if (card.unlockStage <= state.highestClearedStage && !state.unlockedCardIDs.includes(card.id)) {
        state.unlockedCardIDs.push(card.id);
        state.cardLevels[card.id] = 1;
      }
    }
  }

  private static event(
    round: number,
    kind: BattleEvent['kind'],
    sourceID: string | undefined,
    sourceName: string,
    message: string,
    amount: number,
    playerHealthRemaining: number,
    enemyHealthRemaining: number,
  ): BattleEvent {
    return {
      round,
      kind,
      sourceID,
      sourceName,
      message,
      amount,
      playerHealthRemaining: Math.max(0, playerHealthRemaining),
      enemyHealthRemaining: Math.max(0, enemyHealthRemaining),
    };
  }
}
