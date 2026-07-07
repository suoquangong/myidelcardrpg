import { _decorator, Color, Component, Graphics, Label, Node, resources, Sprite, SpriteFrame, UITransform, Vec3, tween } from 'cc';
import { CardDefinition } from '../core/GameTypes';
import { GameCore } from '../core/GameCore';
import { GameStore } from '../services/GameStore';

const { ccclass, property } = _decorator;

type LobbyLabelKey =
  | 'title'
  | 'chapter'
  | 'stage'
  | 'power'
  | 'gold'
  | 'income'
  | 'idle'
  | 'task'
  | 'nextUnlock'
  | 'primaryAction'
  | 'message';

interface HeroSlot {
  root: Node;
  sprite: Sprite;
  nameLabel: Label;
  levelLabel: Label;
  roleLabel: Label;
}

@ccclass('ModernLobbyRuntime')
export class ModernLobbyRuntime extends Component {
  @property
  width = 720;

  @property
  height = 1560;

  private readonly store = GameStore.instance;
  private readonly labels = new Map<LobbyLabelKey, Label>();
  private readonly heroSlots: HeroSlot[] = [];
  private readonly refreshHandler = () => this.refresh();
  private root: Node | null = null;
  private bossSprite: Sprite | null = null;
  private primaryButton: Node | null = null;

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

    this.labels.clear();
    this.heroSlots.length = 0;

    this.root = new Node('ModernLobby');
    this.root.parent = this.node;
    this.root.addComponent(UITransform).setContentSize(this.width, this.height);

    this.createBackground();
    this.createTopBar();
    this.createMapStage();
    this.createLineupCamp();
    this.createRewardDock();
    this.createBottomNav();
  }

  private createBackground(): void {
    const background = this.createNode('LobbyBackground', 0, 0, this.width, this.height);
    this.paintRect(background, new Color(19, 32, 55, 255));
    const sprite = background.addComponent(Sprite);
    this.loadSprite('art/backgrounds/home-lobby-skyhaven/spriteFrame', sprite);

    this.createGradientBand('TopMist', 0, 650, this.width, 300, new Color(255, 246, 218, 70));
    this.createGradientBand('BottomVignette', 0, -620, this.width, 360, new Color(6, 10, 22, 190));
    this.createGradientBand('CenterSoftShade', 0, 70, this.width, 760, new Color(8, 18, 34, 58));
  }

  private createTopBar(): void {
    this.createLabel('title', '星穹远征', -238, 676, 240, 58, 34, new Color(58, 47, 87, 255));
    this.createLabel('chapter', '', -238, 628, 280, 38, 20, new Color(82, 72, 112, 235));

    this.createPill('GoldPill', 210, 670, 210, 54, new Color(255, 248, 221, 222));
    this.createLabel(undefined, '金币', 142, 670, 72, 34, 18, new Color(123, 98, 36, 255));
    this.createLabel('gold', '0', 236, 670, 112, 36, 24, new Color(75, 55, 24, 255));

    this.createPill('IncomeChip', 0, 603, 520, 36, new Color(255, 255, 255, 116));
    this.createLabel('income', '', 0, 603, 500, 30, 18, new Color(68, 68, 96, 235));
  }

  private createMapStage(): void {
    const map = this.createNode('MapStageLayer', 0, 100, 640, 760);
    this.drawPath(map);

    this.createMapMarker('ClearedNode1', -210, -130, 34, new Color(248, 214, 113, 225), map);
    this.createMapMarker('ClearedNode2', -90, -30, 30, new Color(248, 214, 113, 225), map);
    this.createMapMarker('CurrentStageNode', 64, 82, 48, new Color(96, 212, 244, 245), map);
    this.createMapMarker('LockedNode', 208, 190, 30, new Color(177, 178, 196, 180), map);

    const bossPortal = this.createPill('BossPortal', 0, 184, 400, 230, new Color(255, 255, 255, 102), map);
    const bossArt = this.createNode('BossArt', 0, 12, 180, 180, bossPortal);
    this.bossSprite = bossArt.addComponent(Sprite);
    this.loadSprite('art/enemies/enemy-ancient-golem/spriteFrame', this.bossSprite);
    this.createLabel('stage', '', 0, 294, 560, 48, 30, new Color(255, 255, 255, 255), map);
    this.createLabel('power', '', 0, 246, 560, 34, 20, new Color(230, 242, 255, 245), map);
    this.createLabel('nextUnlock', '', 0, -206, 600, 34, 19, new Color(255, 241, 177, 245), map);

    this.primaryButton = this.createButton('PrimaryChallengeButton', 0, -274, 410, 84, new Color(255, 199, 77, 255), () => this.handlePrimaryAction(), map);
    this.createLabel('primaryAction', '挑战首领', 0, 0, 350, 50, 28, new Color(53, 35, 7, 255), this.primaryButton);
  }

  private createLineupCamp(): void {
    this.createPill('LineupGlass', 0, -308, 640, 210, new Color(255, 255, 255, 92));
    this.createLabel(undefined, '出战阵容', -244, -220, 150, 36, 24, new Color(67, 54, 94, 255));
    this.createLabel('task', '', 72, -220, 410, 34, 20, new Color(70, 73, 105, 235));

    const xPositions = [-190, 0, 190];
    for (let index = 0; index < 3; index += 1) {
      this.heroSlots.push(this.createHeroSlot(index, xPositions[index], -318));
    }
  }

  private createRewardDock(): void {
    const dock = this.createPill('RewardDock', -224, -500, 230, 132, new Color(255, 247, 220, 154));
    this.createCircle('RewardIcon', 0, 24, 44, new Color(246, 173, 61, 245), dock);
    this.createLabel(undefined, '宝箱', 0, 24, 100, 34, 22, new Color(82, 55, 18, 255), dock);
    this.createLabel('idle', '', 0, -30, 200, 52, 18, new Color(73, 63, 83, 255), dock);
    dock.on(Node.EventType.TOUCH_END, () => this.store.claimIdleRewards(), this);

    this.createPill('TaskToast', 130, -510, 360, 96, new Color(255, 255, 255, 142));
    this.createLabel('message', '', 130, -510, 324, 70, 20, new Color(62, 63, 84, 245));
  }

  private createBottomNav(): void {
    this.createPill('BottomNav', 0, -682, 660, 116, new Color(255, 250, 232, 202));
    const items = [
      { icon: '⚔', text: '战役' },
      { icon: '◆', text: '英雄' },
      { icon: '▣', text: '阵容' },
      { icon: '☰', text: '背包' },
    ];

    for (let index = 0; index < items.length; index += 1) {
      const x = -246 + index * 164;
      this.createLabel(undefined, items[index].icon, x, -662, 72, 38, 28, new Color(61, 47, 86, 255));
      this.createLabel(undefined, items[index].text, x, -704, 92, 30, 20, new Color(61, 47, 86, 255));
    }
  }

  private createHeroSlot(index: number, x: number, y: number): HeroSlot {
    const root = this.createPill(`HeroSlot${index + 1}`, x, y, 142, 154, new Color(8, 15, 30, 210));
    const portraitNode = this.createNode(`HeroPortrait${index + 1}`, 0, 22, 116, 104, root);
    const sprite = portraitNode.addComponent(Sprite);
    const nameLabel = this.createLabel(undefined, '', 0, -44, 126, 26, 18, new Color(255, 250, 234, 255), root);
    const levelLabel = this.createLabel(undefined, '', 0, -72, 96, 24, 17, new Color(255, 232, 157, 255), root);
    const roleBadge = this.createCircle(`RoleBadge${index + 1}`, -48, -32, 20, new Color(91, 198, 131, 245), root);
    const roleLabel = this.createLabel(undefined, '', 0, 0, 40, 24, 16, new Color(255, 255, 255, 255), roleBadge);

    return { root, sprite, nameLabel, levelLabel, roleLabel };
  }

  private drawPath(parent: Node): void {
    const node = this.createNode('StagePath', 0, 0, 640, 520, parent);
    const graphics = node.addComponent(Graphics);
    graphics.lineWidth = 8;
    graphics.strokeColor = new Color(255, 240, 188, 155);
    graphics.moveTo(-230, -130);
    graphics.bezierCurveTo(-150, -90, -130, -42, -90, -30);
    graphics.bezierCurveTo(-16, -12, 16, 54, 64, 82);
    graphics.bezierCurveTo(116, 112, 156, 148, 208, 190);
    graphics.stroke();
  }

  private createMapMarker(name: string, x: number, y: number, radius: number, color: Color, parent: Node): Node {
    const marker = this.createCircle(name, x, y, radius, color, parent);
    this.createCircle(`${name}Core`, 0, 0, Math.max(10, radius - 16), new Color(255, 255, 255, 230), marker);
    return marker;
  }

  private createGradientBand(name: string, x: number, y: number, width: number, height: number, color: Color): Node {
    return this.createPill(name, x, y, width, height, color);
  }

  private createButton(name: string, x: number, y: number, width: number, height: number, color: Color, callback: () => void, parent?: Node | null): Node {
    const button = this.createPill(name, x, y, width, height, color, parent);
    button.on(Node.EventType.TOUCH_END, callback, this);
    return button;
  }

  private createPill(name: string, x: number, y: number, width: number, height: number, color: Color, parent?: Node | null): Node {
    const node = this.createNode(name, x, y, width, height, parent);
    this.paintRect(node, color);
    return node;
  }

  private createCircle(name: string, x: number, y: number, radius: number, color: Color, parent?: Node | null): Node {
    const node = this.createNode(name, x, y, radius * 2, radius * 2, parent);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = color;
    graphics.circle(0, 0, radius);
    graphics.fill();
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
    parent?: Node | null,
  ): Label {
    const node = this.createNode(key ? `${key}Label` : `Label-${text}`, x, y, width, height, parent);
    const label = node.addComponent(Label);
    label.string = text;
    label.fontSize = fontSize;
    label.lineHeight = Math.floor(fontSize * 1.22);
    label.color = color;

    if (key) {
      this.labels.set(key, label);
    }
    return label;
  }

  private paintRect(node: Node, color: Color): void {
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
    this.setLabel('income', `探索 ${progress.clearedStages}/${progress.totalStages}  ${progress.progressPercent}%    收益 ${idle.goldPerMinute}/分钟`);
    this.setLabel('idle', idle.claimableGold > 0 ? `${this.compactNumber(idle.claimableGold)} 金币\n可领取` : '暂无收益\n继续冒险');
    this.setLabel('task', this.taskText(readiness, recommendation?.cardName, idle.claimableGold, progress.isComplete));
    this.setLabel('nextUnlock', nextUnlock ? `下个英雄：${nextUnlock.name}  通关 ${nextUnlock.unlockStage} 解锁` : '英雄图鉴已全部解锁');
    this.setLabel('primaryAction', this.primaryActionText(readiness, recommendation?.cardName, idle.claimableGold, progress.isComplete));
    this.setLabel('message', this.store.lastMessage || '当前任务：尝试挑战首领，推进更高挂机收益');
    this.refreshHeroSlots();
    this.pulsePrimaryButton();
  }

  private refreshHeroSlots(): void {
    const state = this.store.state;
    const cards = state.lineupCardIDs
      .map((cardID) => GameCore.cards.find((card) => card.id === cardID))
      .filter((card): card is CardDefinition => card !== undefined);

    for (let index = 0; index < this.heroSlots.length; index += 1) {
      const slot = this.heroSlots[index];
      const card = cards[index];
      if (!card) {
        slot.root.active = false;
        continue;
      }

      slot.root.active = true;
      slot.nameLabel.string = card.name;
      slot.levelLabel.string = `Lv.${state.cardLevels[card.id] ?? 1}`;
      slot.roleLabel.string = this.roleText(card.role);
      this.loadSprite(`art/cards/card-${card.id}/spriteFrame`, slot.sprite);
    }
  }

  private handlePrimaryAction(): void {
    const state = this.store.state;
    const idle = GameCore.idleRewardSummary(Date.now(), state);
    const readiness = GameCore.readiness(state);

    if (idle.claimableGold > 0 && readiness !== 'favored') {
      this.store.claimIdleRewards();
      return;
    }

    this.store.challengeCurrentStage();
  }

  private pulsePrimaryButton(): void {
    const button = this.primaryButton;
    if (!button) {
      return;
    }
    tween(button)
      .to(0.12, { scale: new Vec3(1.035, 1.035, 1) })
      .to(0.18, { scale: new Vec3(1, 1, 1) })
      .start();
  }

  private taskText(readiness: string, cardName: string | undefined, claimableGold: number, isComplete: boolean): string {
    if (isComplete) {
      return '等待新章节开放';
    }
    if (readiness === 'favored') {
      return '战力占优，推进主线';
    }
    if (claimableGold > 0) {
      return '先领收益，再补强阵容';
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

  private roleText(role: string): string {
    if (role === 'tank') {
      return '盾';
    }
    if (role === 'support') {
      return '疗';
    }
    return '攻';
  }

  private setLabel(key: LobbyLabelKey, text: string): void {
    const label = this.labels.get(key);
    if (label) {
      label.string = text;
    }
  }

  private loadSprite(path: string, sprite: Sprite): void {
    resources.load(path, SpriteFrame, (error, spriteFrame) => {
      if (!error && spriteFrame && sprite.isValid) {
        sprite.spriteFrame = spriteFrame;
      }
    });
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
