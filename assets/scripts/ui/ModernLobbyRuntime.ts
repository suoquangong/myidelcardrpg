import { _decorator, Color, Component, Graphics, Label, Node, resources, Sprite, SpriteFrame, UITransform } from 'cc';
import { GameCore } from '../core/GameCore';
import { GameStore } from '../services/GameStore';

const { ccclass, property } = _decorator;

type LobbyLabelKey = 'title' | 'chapter' | 'stage' | 'power' | 'gold' | 'income' | 'idle' | 'task' | 'nextUnlock' | 'primaryAction' | 'message';

@ccclass('ModernLobbyRuntime')
export class ModernLobbyRuntime extends Component {
  @property
  width = 720;

  @property
  height = 1560;

  private readonly store = GameStore.instance;
  private readonly labels = new Map<LobbyLabelKey, Label>();
  private readonly refreshHandler = () => this.refresh();
  private root: Node | null = null;

  onLoad(): void {
    this.buildLobby();
  }

  onEnable(): void {
    this.store.subscribe(this.refreshHandler);
    this.refresh();
  }

  onDisable(): void {
    this.store.unsubscribe(this.refreshHandler);
  }

  private buildLobby(): void {
    if (this.root?.isValid) {
      return;
    }

    this.root = new Node('ModernLobby');
    this.root.parent = this.node;
    this.root.addComponent(UITransform).setContentSize(this.width, this.height);

    this.createBackground();
    this.createTopBar();
    this.createStagePanel();
    this.createIdlePanel();
    this.createBottomNav();
  }

  private createBackground(): void {
    const background = this.createNode('LobbyBackground', 0, 0, this.width, this.height);
    this.paint(background, new Color(15, 23, 42, 255));
    const sprite = background.addComponent(Sprite);

    resources.load('art/backgrounds/home-lobby-skyhaven/spriteFrame', SpriteFrame, (error, spriteFrame) => {
      if (!error && spriteFrame && sprite.isValid) {
        sprite.spriteFrame = spriteFrame;
      }
    });

    const shade = this.createNode('BackgroundShade', 0, 0, this.width, this.height);
    this.paint(shade, new Color(5, 10, 24, 112));
  }

  private createTopBar(): void {
    this.createLabel('title', '星穹远征', -230, 660, 220, 58, 34, new Color(255, 246, 220, 255), 'left');
    this.createPill('GoldPill', 214, 660, 220, 52, new Color(18, 27, 47, 210));
    this.createLabel('gold', '0', 214, 660, 180, 42, 24, new Color(255, 216, 121, 255), 'center');
    this.createLabel('income', '', 0, 606, 640, 36, 20, new Color(190, 225, 255, 235), 'center');
  }

  private createStagePanel(): void {
    this.createPill('StagePanel', 0, 170, 640, 690, new Color(8, 15, 31, 172));
    this.createLabel('chapter', '', 0, 445, 560, 42, 24, new Color(137, 217, 255, 255), 'center');
    this.createLabel('stage', '', 0, 380, 560, 64, 34, new Color(255, 255, 255, 255), 'center');
    this.createLabel('power', '', 0, 315, 540, 42, 22, new Color(214, 232, 255, 255), 'center');
    this.createLabel('nextUnlock', '', 0, 250, 560, 42, 20, new Color(255, 221, 148, 255), 'center');

    this.createPill('BossPreview', 0, 80, 430, 250, new Color(20, 35, 62, 190));
    this.createLabel('task', '', 0, 70, 360, 70, 24, new Color(255, 255, 255, 245), 'center');

    const challengeButton = this.createButton('ChallengeButton', 0, -170, 430, 86, new Color(244, 181, 74, 255), () => {
      this.store.challengeCurrentStage();
    });
    this.createLabel('primaryAction', '挑战首领', 0, 0, 380, 54, 28, new Color(36, 23, 6, 255), 'center', challengeButton);
  }

  private createIdlePanel(): void {
    this.createPill('IdleRewardPanel', 0, -360, 640, 150, new Color(13, 24, 43, 205));
    this.createLabel('idle', '', -88, -360, 370, 70, 24, new Color(255, 240, 199, 255), 'left');
    const claimButton = this.createButton('ClaimIdleButton', 230, -360, 150, 74, new Color(97, 211, 154, 255), () => {
      this.store.claimIdleRewards();
    });
    this.createLabel(undefined, '领取', 0, 0, 120, 42, 24, new Color(6, 40, 24, 255), 'center', claimButton);
    this.createLabel('message', '', 0, -460, 620, 34, 20, new Color(202, 216, 235, 230), 'center');
  }

  private createBottomNav(): void {
    this.createPill('BottomNav', 0, -654, 640, 110, new Color(8, 13, 28, 224));
    const items = ['英雄', '阵容', '战斗', '背包'];
    for (let index = 0; index < items.length; index += 1) {
      this.createLabel(undefined, items[index], -240 + index * 160, -654, 110, 46, 22, new Color(232, 239, 255, 255), 'center');
    }
  }

  private createButton(name: string, x: number, y: number, width: number, height: number, color: Color, callback: () => void): Node {
    const button = this.createPill(name, x, y, width, height, color);
    button.on(Node.EventType.TOUCH_END, callback, this);
    return button;
  }

  private createPill(name: string, x: number, y: number, width: number, height: number, color: Color): Node {
    const node = this.createNode(name, x, y, width, height);
    this.paint(node, color);
    return node;
  }

  private createNode(name: string, x: number, y: number, width: number, height: number, parent?: Node | null): Node {
    const node = new Node(name);
    const targetParent = parent ?? this.root;
    if (targetParent) {
      node.parent = targetParent;
    }
    node.setPosition(x, y, 0);
    node.addComponent(UITransform).setContentSize(width, height);
    return node;
  }

  private createLabel(
    key: LobbyLabelKey | undefined,
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    fontSize: number,
    color: Color,
    align: 'left' | 'center',
    parent?: Node | null,
  ): Label {
    const node = this.createNode(key ? `${key}Label` : `Label-${text}`, x, y, width, height, parent);
    const label = node.addComponent(Label);
    label.string = text;
    label.fontSize = fontSize;
    label.lineHeight = Math.floor(fontSize * 1.25);
    label.color = color;
    void align;

    if (key) {
      this.labels.set(key, label);
    }
    return label;
  }

  private paint(node: Node, color: Color): void {
    const transform = node.getComponent(UITransform);
    const graphics = node.addComponent(Graphics);
    const width = transform?.contentSize.width ?? 0;
    const height = transform?.contentSize.height ?? 0;
    graphics.fillColor = color;
    graphics.rect(-width / 2, -height / 2, width, height);
    graphics.fill();
  }

  private refresh(): void {
    const state = this.store.state;
    const progress = GameCore.stageProgress(state);
    const stage = GameCore.currentStageDefinition(state);
    const power = GameCore.lineupBattlePower(state);
    const recommended = stage ? GameCore.recommendedPower(stage) : 0;
    const readiness = GameCore.readiness(state);
    const recommendation = GameCore.bestUpgradeRecommendation(state);
    const idle = GameCore.idleRewardSummary(Date.now(), state);
    const nextUnlock = GameCore.nextUnlock(state);

    this.setLabel('chapter', `第 ${progress.chapterIndex + 1} 章  ${progress.chapterName}`);
    this.setLabel('stage', progress.isComplete ? '全部关卡已通关' : `关卡 ${progress.currentStage}  ${stage?.enemyName ?? ''}`);
    this.setLabel('power', progress.isComplete ? `战力 ${power}` : `战力 ${power} / 推荐 ${recommended}`);
    this.setLabel('gold', this.compactNumber(state.gold));
    this.setLabel('income', `探索进度 ${progress.clearedStages}/${progress.totalStages}  ${progress.progressPercent}%    收益 ${idle.goldPerMinute}/分钟`);
    this.setLabel('idle', idle.claimableGold > 0 ? `挂机收益\n${this.compactNumber(idle.claimableGold)} 金币可领取` : '挂机收益\n暂无可领取奖励');
    this.setLabel('task', this.taskText(readiness, recommendation?.cardName, idle.claimableGold, progress.isComplete));
    this.setLabel('nextUnlock', nextUnlock ? `下个英雄：${nextUnlock.name}  通关 ${nextUnlock.unlockStage} 解锁` : '英雄图鉴已全部解锁');
    this.setLabel('primaryAction', this.primaryActionText(readiness, recommendation?.cardName, idle.claimableGold, progress.isComplete));
    this.setLabel('message', this.store.lastMessage);
  }

  private taskText(readiness: string, cardName: string | undefined, claimableGold: number, isComplete: boolean): string {
    if (isComplete) {
      return '等待新章节开放';
    }
    if (readiness === 'favored') {
      return '当前战力占优，可以推进主线';
    }
    if (claimableGold > 0) {
      return '先领取挂机收益，再补强阵容';
    }
    return cardName ? `推荐升级 ${cardName}` : '调整阵容后再挑战';
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
    return cardName ? '去升级' : '调阵容';
  }

  private setLabel(key: LobbyLabelKey, text: string): void {
    const label = this.labels.get(key);
    if (label) {
      label.string = text;
    }
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
}
