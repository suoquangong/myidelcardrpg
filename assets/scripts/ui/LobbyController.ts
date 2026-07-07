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
  powerLabel: Label | null = null;

  @property(Label)
  goldLabel: Label | null = null;

  @property(Label)
  idleRewardLabel: Label | null = null;

  @property(Label)
  taskLabel: Label | null = null;

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
    const currentStage = GameCore.currentStage(state);
    const stage = GameCore.currentStageDefinition(state);
    const power = GameCore.lineupBattlePower(state);
    const recommended = stage ? GameCore.recommendedPower(stage) : 0;
    const readiness = GameCore.readiness(state);
    const recommendation = GameCore.bestUpgradeRecommendation(state);

    this.setText(this.titleLabel, 'Idle Card RPG');
    this.setText(this.stageLabel, `挑战关卡 ${currentStage}`);
    this.setText(this.powerLabel, `战力 ${power} / 推荐 ${recommended}`);
    this.setText(this.goldLabel, `${state.gold}`);
    this.setText(this.idleRewardLabel, `领取 ${this.store.claimableIdleGold()} 金币`);
    this.setText(this.taskLabel, this.taskText(readiness, recommendation?.cardName));
    this.setText(this.messageLabel, this.store.lastMessage);
  }

  private taskText(readiness: string, cardName?: string): string {
    if (readiness === 'favored') {
      return '当前任务：推进下一关';
    }
    if (cardName) {
      return `当前任务：升级 ${cardName}`;
    }
    return '当前任务：调整阵容';
  }

  private setText(label: Label | null, text: string): void {
    if (label) {
      label.string = text;
    }
  }
}
