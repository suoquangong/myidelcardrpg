import { _decorator, Component, Label } from 'cc';
import { GameCore } from '../core/GameCore';
import { GameStore } from '../services/GameStore';

const { ccclass, property } = _decorator;

@ccclass('LobbyController')
export class LobbyController extends Component {
  @property(Label)
  titleLabel: Label | null = null;

  @property(Label)
  stageLabel: Label | null = null;

  @property(Label)
  chapterLabel: Label | null = null;

  @property(Label)
  progressLabel: Label | null = null;

  @property(Label)
  powerLabel: Label | null = null;

  @property(Label)
  goldLabel: Label | null = null;

  @property(Label)
  incomeLabel: Label | null = null;

  @property(Label)
  idleRewardLabel: Label | null = null;

  @property(Label)
  taskLabel: Label | null = null;

  @property(Label)
  nextUnlockLabel: Label | null = null;

  @property(Label)
  primaryActionLabel: Label | null = null;

  @property(Label)
  messageLabel: Label | null = null;

  private readonly store = GameStore.instance;
  private readonly refreshHandler = () => this.refresh();

  onEnable(): void {
    this.store.subscribe(this.refreshHandler);
    this.refresh();
  }

  onDisable(): void {
    this.store.unsubscribe(this.refreshHandler);
  }

  claimIdleRewards(): void {
    this.store.claimIdleRewards();
  }

  challengeCurrentStage(): void {
    this.store.challengeCurrentStage();
  }

  resetProgress(): void {
    this.store.reset();
  }

  refresh(): void {
    const state = this.store.state;
    const progress = GameCore.stageProgress(state);
    const stage = GameCore.currentStageDefinition(state);
    const power = GameCore.lineupBattlePower(state);
    const recommended = stage ? GameCore.recommendedPower(stage) : 0;
    const readiness = GameCore.readiness(state);
    const recommendation = GameCore.bestUpgradeRecommendation(state);
    const idle = GameCore.idleRewardSummary(Date.now(), state);
    const nextUnlock = GameCore.nextUnlock(state);

    this.setText(this.titleLabel, '星穹远征');
    this.setText(this.stageLabel, progress.isComplete ? '全部关卡已通关' : `关卡 ${progress.currentStage}  ${stage?.enemyName ?? ''}`);
    this.setText(this.chapterLabel, `第 ${progress.chapterIndex + 1} 章  ${progress.chapterName}`);
    this.setText(this.progressLabel, `探索进度 ${progress.clearedStages}/${progress.totalStages}  ${progress.progressPercent}%`);
    this.setText(this.powerLabel, progress.isComplete ? `战力 ${power}` : `战力 ${power} / 推荐 ${recommended}`);
    this.setText(this.goldLabel, `${this.compactNumber(state.gold)}`);
    this.setText(this.incomeLabel, `收益 ${idle.goldPerMinute}/分钟  储存 ${idle.storedMinutes}/${idle.capMinutes} 分钟`);
    this.setText(this.idleRewardLabel, idle.claimableGold > 0 ? `领取 ${this.compactNumber(idle.claimableGold)} 金币` : '暂无可领取收益');
    this.setText(this.taskLabel, this.taskText(readiness, recommendation?.cardName, idle.claimableGold, progress.isComplete));
    this.setText(this.nextUnlockLabel, nextUnlock ? `下个英雄：${nextUnlock.name}  通关 ${nextUnlock.unlockStage} 解锁` : '英雄图鉴已全部解锁');
    this.setText(this.primaryActionLabel, this.primaryActionText(readiness, recommendation?.cardName, idle.claimableGold, progress.isComplete));
    this.setText(this.messageLabel, this.store.lastMessage);
  }

  private taskText(readiness: string, cardName: string | undefined, claimableGold: number, isComplete: boolean): string {
    if (isComplete) {
      return '当前任务：等待新章节开放';
    }
    if (readiness === 'favored') {
      return '当前任务：推进主线';
    }
    if (claimableGold > 0) {
      return '当前任务：领取挂机收益';
    }
    if (cardName) {
      return `当前任务：升级 ${cardName}`;
    }
    return '当前任务：调整阵容';
  }

  private primaryActionText(readiness: string, cardName: string | undefined, claimableGold: number, isComplete: boolean): string {
    if (isComplete) {
      return '已通关';
    }
    if (readiness === 'favored') {
      return '挑战首领';
    }
    if (claimableGold > 0) {
      return '领取收益';
    }
    return cardName ? `升级 ${cardName}` : '调整阵容';
  }

  private compactNumber(value: number): string {
    if (value >= 1000000) {
      return `${Math.floor(value / 10000)}万`;
    }
    if (value >= 10000) {
      return `${(value / 10000).toFixed(1)}万`;
    }
    return `${value}`;
  }

  private setText(label: Label | null, text: string): void {
    if (label) {
      label.string = text;
    }
  }
}
