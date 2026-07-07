import { _decorator, Component, Label, tween, Vec3 } from 'cc';
import { GameCore } from '../core/GameCore';
import { BattleEvent } from '../core/GameTypes';
import { GameStore } from '../services/GameStore';

const { ccclass, property } = _decorator;

@ccclass('BattleController')
export class BattleController extends Component {
  @property(Label)
  headerLabel: Label | null = null;

  @property(Label)
  playerHpLabel: Label | null = null;

  @property(Label)
  enemyHpLabel: Label | null = null;

  @property(Label)
  logLabel: Label | null = null;

  @property
  maxLogLines = 7;

  private readonly store = GameStore.instance;
  private playbackIndex = 0;
  private events: BattleEvent[] = [];

  onEnable(): void {
    this.refreshSummary();
  }

  runBattle(): void {
    const result = this.store.challengeCurrentStage();
    if (!result) {
      this.refreshSummary();
      return;
    }

    this.events = result.events;
    this.playbackIndex = 0;
    this.logLabel && (this.logLabel.string = '');
    this.playNext();
  }

  refreshSummary(): void {
    const state = this.store.state;
    const stage = GameCore.currentStageDefinition(state);
    const power = GameCore.lineupBattlePower(state);
    this.setText(this.headerLabel, stage ? `关卡 ${stage.id}  ${stage.enemyName}` : '全部关卡已完成');
    this.setText(this.playerHpLabel, `战力 ${power}`);
    this.setText(this.enemyHpLabel, stage ? `敌方 HP ${stage.enemyHealth}` : '');
    this.setText(this.logLabel, this.store.lastMessage);
  }

  private playNext(): void {
    const event = this.events[this.playbackIndex];
    if (!event) {
      this.refreshSummary();
      return;
    }

    this.appendLog(event.message);
    this.setText(this.playerHpLabel, `我方 HP ${event.playerHealthRemaining}`);
    this.setText(this.enemyHpLabel, `敌方 HP ${event.enemyHealthRemaining}`);

    tween(this.node)
      .to(0.08, { scale: new Vec3(1.015, 1.015, 1) })
      .to(0.1, { scale: Vec3.ONE })
      .call(() => {
        this.playbackIndex += 1;
        this.scheduleOnce(() => this.playNext(), 0.28);
      })
      .start();
  }

  private appendLog(message: string): void {
    if (!this.logLabel) {
      return;
    }
    const lines = this.logLabel.string.length > 0 ? this.logLabel.string.split('\n') : [];
    lines.push(message);
    this.logLabel.string = lines.slice(-this.maxLogLines).join('\n');
  }

  private setText(label: Label | null, text: string): void {
    if (label) {
      label.string = text;
    }
  }
}
