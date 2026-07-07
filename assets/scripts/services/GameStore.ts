import { GameCore } from '../core/GameCore';
import { BattleResult, GameRuleError, GameState } from '../core/GameTypes';
import { SaveService } from './SaveService';

type Listener = () => void;

export class GameStore {
  private static instanceValue: GameStore | undefined;

  state: GameState;
  lastMessage = '';
  lastBattleResult: BattleResult | undefined;

  private readonly listeners: Listener[] = [];

  private constructor() {
    this.state = SaveService.load();
  }

  static get instance(): GameStore {
    if (!this.instanceValue) {
      this.instanceValue = new GameStore();
    }
    return this.instanceValue;
  }

  subscribe(listener: Listener): void {
    if (!this.listeners.includes(listener)) {
      this.listeners.push(listener);
    }
  }

  unsubscribe(listener: Listener): void {
    const index = this.listeners.indexOf(listener);
    if (index >= 0) {
      this.listeners.splice(index, 1);
    }
  }

  claimableIdleGold(now = Date.now()): number {
    return GameCore.idleRewards(now, this.state);
  }

  claimIdleRewards(now = Date.now()): number {
    const reward = GameCore.claimIdleRewards(now, this.state);
    this.lastMessage = reward > 0 ? `领取 ${reward} 金币` : '暂无放置收益';
    this.persist();
    return reward;
  }

  upgradeCard(cardID: string): void {
    try {
      GameCore.upgradeCard(cardID, this.state);
      this.lastMessage = '升级成功';
    } catch (error) {
      this.lastMessage = this.messageForError(error, '无法升级');
    }
    this.persist();
  }

  toggleLineupCard(cardID: string): void {
    try {
      GameCore.toggleLineupCard(cardID, this.state);
      this.lastMessage = '阵容已更新';
    } catch (error) {
      this.lastMessage = this.messageForError(error, '无法调整阵容');
    }
    this.persist();
  }

  challengeCurrentStage(): BattleResult | undefined {
    try {
      const result = GameCore.resolveAutoBattle(this.state);
      this.lastBattleResult = result;
      this.lastMessage = result.victory ? '挑战胜利' : '挑战失败';
      this.persist();
      return result;
    } catch {
      this.lastMessage = '阵容未就绪';
      this.emit();
      return undefined;
    }
  }

  reset(): void {
    this.state = SaveService.reset();
    this.lastBattleResult = undefined;
    this.lastMessage = '进度已重置';
    this.emit();
  }

  private persist(): void {
    SaveService.save(this.state);
    this.emit();
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private messageForError(error: unknown, fallback: string): string {
    if (!(error instanceof GameRuleError)) {
      return fallback;
    }

    switch (error.code) {
      case 'insufficientGold':
        return '金币不足';
      case 'cardLocked':
        return '卡牌尚未解锁';
      case 'lineupFull':
        return '阵容最多 3 张';
      default:
        return fallback;
    }
  }
}
