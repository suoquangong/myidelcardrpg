import { _decorator, Color, Component, Graphics, Label, Node, resources, Sprite, SpriteFrame, UITransform, Vec3, tween } from 'cc';
import { CardDefinition, UpgradeRecommendation } from '../core/GameTypes';
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
  private campaignProgressFill: Node | null = null;

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
    this.createBottomNav();
  }

  private createBackground(): void {
    const base = this.createNode('SceneBase', 0, 0, this.width, this.height);
    this.paintRect(base, new Color(12, 21, 36, 255));

    const background = this.createNode('LobbyBackground', 0, 0, this.width, this.height);
    const sprite = background.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    this.loadSprite('art/backgrounds/home-lobby-skyhaven/spriteFrame', sprite);

    this.createGradientBand('TopMist', 0, 665, this.width, 230, new Color(255, 242, 196, 55));
    this.createGradientBand('CenterDepth', 0, 115, this.width, 710, new Color(5, 12, 25, 72));
    this.createScenerySilhouette();
    this.createGradientBand('BottomVignette', 0, -610, this.width, 340, new Color(4, 7, 16, 205));
  }

  private createTopBar(): void {
    const layer = this.createNode('TopResourceLayer', 0, 0, this.width, this.height);
    this.createPanel('PlayerPlate', -205, 707, 286, 72, new Color(18, 23, 42, 178), new Color(240, 203, 118, 150), layer);
    this.createLabel('title', '指挥官', -252, 722, 160, 30, 22, new Color(255, 241, 190, 255), layer);
    this.createLabel('chapter', '', -208, 685, 268, 28, 18, new Color(216, 228, 255, 235), layer);

    this.createPanel('GoldPill', 222, 722, 222, 48, new Color(34, 28, 25, 190), new Color(255, 205, 87, 185), layer);
    this.createCircle('GoldIcon', 129, 722, 16, new Color(255, 198, 67, 245), layer);
    this.createLabel(undefined, '金币', 174, 722, 66, 28, 17, new Color(255, 229, 159, 255), layer);
    this.createLabel('gold', '0', 254, 722, 110, 30, 22, new Color(255, 248, 217, 255), layer);

    this.createPanel('PowerPill', 222, 668, 222, 42, new Color(20, 30, 48, 185), new Color(117, 202, 255, 130), layer);
    this.createLabel('power', '', 222, 668, 202, 28, 17, new Color(224, 242, 255, 255), layer);

    this.createPanel('IncomeChip', 0, 616, 584, 34, new Color(9, 16, 31, 120), new Color(255, 255, 255, 55), layer);
    this.createLabel('income', '', 0, 616, 552, 26, 17, new Color(228, 236, 255, 230), layer);
  }

  private createMapStage(): void {
    const map = this.createNode('CampaignLayer', 0, 0, this.width, this.height);
    this.createPanel('CampaignFocus', 0, 260, 606, 440, new Color(8, 16, 31, 96), new Color(255, 224, 145, 92), map);
    this.drawPath(map);

    this.createMapMarker('ClearedNode1', -248, 106, 24, new Color(248, 214, 113, 230), map);
    this.createMapMarker('ClearedNode2', -194, 172, 22, new Color(248, 214, 113, 230), map);
    this.createMapMarker('CurrentStageNode', -196, 256, 32, new Color(96, 212, 244, 245), map);
    this.createMapMarker('LockedNode1', 178, 336, 22, new Color(177, 178, 196, 170), map);
    this.createMapMarker('LockedNode2', 250, 410, 20, new Color(177, 178, 196, 150), map);

    this.createLabel(undefined, '战役目标', -218, 443, 140, 30, 20, new Color(255, 222, 150, 255), map);
    this.createLabel('stage', '', 80, 443, 350, 38, 27, new Color(255, 255, 255, 255), map);

    const bossPortal = this.createPanel('BossPortal', 0, 292, 270, 238, new Color(12, 25, 48, 128), new Color(110, 223, 255, 122), map);
    this.createCircle('BossHalo', 0, 18, 90, new Color(76, 172, 235, 76), bossPortal);
    const bossArt = this.createNode('BossArt', 0, 18, 220, 210, bossPortal);
    this.bossSprite = bossArt.addComponent(Sprite);
    this.bossSprite.sizeMode = Sprite.SizeMode.CUSTOM;
    this.loadSprite('art/enemies/enemy-ancient-golem/spriteFrame', this.bossSprite);

    this.primaryButton = this.createButton('PrimaryChallengeButton', 0, 92, 382, 78, new Color(238, 157, 47, 245), () => this.handlePrimaryAction(), map);
    this.paintRect(this.createNode('ButtonShine', 0, 19, 342, 4, this.primaryButton), new Color(255, 239, 168, 170));
    this.createLabel('primaryAction', '挑战首领', 0, 2, 320, 44, 28, new Color(45, 28, 5, 255), this.primaryButton);
    this.createCampaignProgressRail(map);
    this.createLabel('nextUnlock', '', 0, 16, 610, 28, 18, new Color(255, 238, 165, 245), map);
  }

  private createLineupCamp(): void {
    const layer = this.createNode('LineupIdleLayer', 0, 0, this.width, this.height);
    this.createPanel('LineupShelf', 0, -348, 660, 218, new Color(8, 13, 26, 164), new Color(255, 226, 146, 96), layer);
    this.createLabel(undefined, '出战阵容', -238, -235, 150, 32, 22, new Color(255, 225, 157, 255), layer);
    this.createLabel('task', '', 88, -235, 438, 30, 18, new Color(227, 235, 255, 235), layer);

    const xPositions = [-190, 0, 190];
    for (let index = 0; index < 3; index += 1) {
      this.heroSlots.push(this.createHeroSlot(index, xPositions[index], -354, layer));
    }

    this.createRewardDock(layer);
  }

  private createRewardDock(parent: Node): void {
    const dock = this.createPanel('RewardDock', -210, -552, 256, 96, new Color(35, 24, 18, 188), new Color(255, 194, 82, 155), parent);
    this.createCircle('RewardIcon', -82, 0, 30, new Color(246, 173, 61, 245), dock);
    this.createLabel(undefined, '宝箱', -82, 1, 72, 26, 20, new Color(82, 55, 18, 255), dock);
    this.createLabel('idle', '', 40, 0, 162, 56, 17, new Color(255, 242, 210, 255), dock);
    dock.on(Node.EventType.TOUCH_END, () => this.store.claimIdleRewards(), this);

    this.createPanel('TaskToast', 126, -552, 374, 96, new Color(12, 20, 35, 172), new Color(117, 202, 255, 92), parent);
    this.createLabel('message', '', 126, -552, 334, 62, 19, new Color(231, 239, 255, 245), parent);
  }

  private createScenerySilhouette(): void {
    const city = this.createNode('CitadelSilhouette', 0, 28, this.width, 360);
    const cityGraphics = city.addComponent(Graphics);
    cityGraphics.fillColor = new Color(8, 16, 32, 108);
    cityGraphics.moveTo(-360, -180);
    cityGraphics.lineTo(-360, -56);
    cityGraphics.lineTo(-272, -34);
    cityGraphics.lineTo(-238, -116);
    cityGraphics.lineTo(-206, -26);
    cityGraphics.lineTo(-122, -4);
    cityGraphics.lineTo(-82, -92);
    cityGraphics.lineTo(-36, 18);
    cityGraphics.lineTo(30, -82);
    cityGraphics.lineTo(82, 4);
    cityGraphics.lineTo(152, -22);
    cityGraphics.lineTo(190, -106);
    cityGraphics.lineTo(228, -28);
    cityGraphics.lineTo(360, -66);
    cityGraphics.lineTo(360, -180);
    cityGraphics.lineTo(-360, -180);
    cityGraphics.fill();

    const terrace = this.createNode('HeroTerraceShadow', 0, -462, 620, 96);
    const terraceGraphics = terrace.addComponent(Graphics);
    terraceGraphics.fillColor = new Color(6, 10, 20, 168);
    terraceGraphics.strokeColor = new Color(255, 218, 124, 70);
    terraceGraphics.lineWidth = 3;
    terraceGraphics.moveTo(-310, -18);
    terraceGraphics.lineTo(-256, 42);
    terraceGraphics.lineTo(256, 42);
    terraceGraphics.lineTo(310, -18);
    terraceGraphics.lineTo(242, -48);
    terraceGraphics.lineTo(-242, -48);
    terraceGraphics.lineTo(-310, -18);
    terraceGraphics.fill();
    terraceGraphics.stroke();
  }

  private createBottomNav(): void {
    const layer = this.createNode('BottomNavLayer', 0, 0, this.width, this.height);
    this.createPanel('BottomNav', 0, -706, 666, 122, new Color(8, 12, 24, 228), new Color(255, 209, 111, 150), layer);
    const items = [
      { icon: '⚔', text: '战役' },
      { icon: '◆', text: '英雄' },
      { icon: '▣', text: '阵容' },
      { icon: '☰', text: '背包' },
    ];

    for (let index = 0; index < items.length; index += 1) {
      const x = -246 + index * 164;
      this.createPanel(`NavButton${index + 1}`, x, -706, 128, 90, new Color(27, 36, 58, 224), new Color(250, 201, 101, 120), layer);
      this.createLabel(undefined, items[index].icon, x, -690, 72, 34, 27, new Color(255, 221, 139, 255), layer);
      this.createLabel(undefined, items[index].text, x, -727, 92, 26, 18, new Color(232, 238, 255, 245), layer);
    }
  }

  private createHeroSlot(index: number, x: number, y: number, parent: Node): HeroSlot {
    const root = this.createPanel(`HeroSlot${index + 1}`, x, y, 126, 154, new Color(15, 23, 39, 222), new Color(255, 230, 156, 100), parent);
    const portraitNode = this.createNode(`HeroPortrait${index + 1}`, 0, 26, 110, 92, root);
    const sprite = portraitNode.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    const nameLabel = this.createLabel(undefined, '', 0, -38, 112, 24, 17, new Color(255, 250, 234, 255), root);
    const levelLabel = this.createLabel(undefined, '', 0, -65, 86, 22, 16, new Color(255, 232, 157, 255), root);
    const roleBadge = this.createCircle(`RoleBadge${index + 1}`, -43, -26, 17, new Color(91, 198, 131, 245), root);
    const roleLabel = this.createLabel(undefined, '', 0, 0, 34, 22, 15, new Color(255, 255, 255, 255), roleBadge);

    return { root, sprite, nameLabel, levelLabel, roleLabel };
  }

  private drawPath(parent: Node): void {
    const node = this.createNode('StagePath', 0, 0, this.width, this.height, parent);
    const graphics = node.addComponent(Graphics);
    graphics.lineWidth = 8;
    graphics.strokeColor = new Color(255, 228, 156, 145);
    graphics.moveTo(-248, 106);
    graphics.lineTo(-194, 172);
    graphics.lineTo(-196, 256);
    graphics.lineTo(178, 336);
    graphics.lineTo(250, 410);
    graphics.stroke();
  }

  private createCampaignProgressRail(parent: Node): void {
    const rail = this.createPanel('CampaignProgressRail', 0, 146, 420, 28, new Color(6, 11, 22, 178), new Color(255, 228, 156, 95), parent);
    this.paintRect(this.createNode('CampaignProgressTrack', 0, 0, 382, 8, rail), new Color(255, 255, 255, 48));
    this.campaignProgressFill = this.createNode('CampaignProgressFill', -191, 0, 382, 8, rail);
    this.paintRect(this.campaignProgressFill, new Color(103, 220, 255, 210));
  }

  private createMapMarker(name: string, x: number, y: number, radius: number, color: Color, parent: Node): Node {
    const marker = this.createCircle(name, x, y, radius, color, parent);
    this.createCircle(`${name}Core`, 0, 0, Math.max(10, radius - 16), new Color(255, 255, 255, 230), marker);
    return marker;
  }

  private createGradientBand(name: string, x: number, y: number, width: number, height: number, color: Color): Node {
    const node = this.createNode(name, x, y, width, height);
    this.paintRect(node, color);
    return node;
  }

  private createButton(name: string, x: number, y: number, width: number, height: number, color: Color, callback: () => void, parent?: Node | null): Node {
    const button = this.createPanel(name, x, y, width, height, color, new Color(255, 235, 157, 150), parent);
    button.on(Node.EventType.TOUCH_END, callback, this);
    return button;
  }

  private createPanel(name: string, x: number, y: number, width: number, height: number, color: Color, stroke?: Color, parent?: Node | null): Node {
    const node = this.createNode(name, x, y, width, height, parent);
    this.paintBeveledRect(node, color, stroke);
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
    label.overflow = Label.Overflow.SHRINK;

    if (key) {
      this.labels.set(key, label);
    }
    return label;
  }

  private paintRect(node: Node, color: Color, stroke?: Color): void {
    const transform = node.getComponent(UITransform);
    const graphics = node.addComponent(Graphics);
    const width = transform?.contentSize.width ?? 0;
    const height = transform?.contentSize.height ?? 0;
    graphics.fillColor = color;
    graphics.rect(-width / 2, -height / 2, width, height);
    graphics.fill();
    if (stroke) {
      graphics.lineWidth = 2;
      graphics.strokeColor = stroke;
      graphics.rect(-width / 2, -height / 2, width, height);
      graphics.stroke();
    }
  }

  private paintBeveledRect(node: Node, color: Color, stroke?: Color): void {
    const transform = node.getComponent(UITransform);
    const graphics = node.addComponent(Graphics);
    const width = transform?.contentSize.width ?? 0;
    const height = transform?.contentSize.height ?? 0;
    const cut = Math.min(18, width / 8, height / 4);

    graphics.fillColor = color;
    this.drawBeveledPath(graphics, width, height, cut);
    graphics.fill();

    if (stroke) {
      graphics.lineWidth = 2;
      graphics.strokeColor = stroke;
      this.drawBeveledPath(graphics, width, height, cut);
      graphics.stroke();
    }
  }

  private drawBeveledPath(graphics: Graphics, width: number, height: number, cut: number): void {
    const left = -width / 2;
    const right = width / 2;
    const bottom = -height / 2;
    const top = height / 2;

    graphics.moveTo(left + cut, bottom);
    graphics.lineTo(right - cut, bottom);
    graphics.lineTo(right, bottom + cut);
    graphics.lineTo(right, top - cut);
    graphics.lineTo(right - cut, top);
    graphics.lineTo(left + cut, top);
    graphics.lineTo(left, top - cut);
    graphics.lineTo(left, bottom + cut);
    graphics.lineTo(left + cut, bottom);
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
    this.setLabel('task', this.taskText(readiness, recommendation, idle.claimableGold, state.gold, progress.isComplete));
    this.setLabel('nextUnlock', nextUnlock ? `下个英雄：${nextUnlock.name}  通关 ${nextUnlock.unlockStage} 解锁` : '英雄图鉴已全部解锁');
    this.setLabel('primaryAction', this.primaryActionText(readiness, recommendation, idle.claimableGold, progress.isComplete));
    this.setLabel('message', this.store.lastMessage || '当前任务：尝试挑战首领，推进更高挂机收益');
    this.refreshCampaignProgress(progress.progressPercent);
    this.refreshHeroSlots();
    this.pulsePrimaryButton();
  }

  private refreshCampaignProgress(progressPercent: number): void {
    const fill = this.campaignProgressFill;
    if (!fill) {
      return;
    }

    const progress = Math.max(0, Math.min(100, progressPercent)) / 100;
    fill.setScale(progress, 1, 1);
    fill.setPosition(-191 + 191 * progress, 0, 0);
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
    const recommendation = GameCore.bestUpgradeRecommendation(state);

    if (idle.claimableGold > 0 && readiness !== 'favored') {
      this.store.claimIdleRewards();
      return;
    }

    if (readiness !== 'favored' && recommendation?.canAfford) {
      this.store.upgradeCard(recommendation.cardID);
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

  private taskText(readiness: string, recommendation: UpgradeRecommendation | undefined, claimableGold: number, gold: number, isComplete: boolean): string {
    if (isComplete) {
      return '等待新章节开放';
    }
    if (readiness === 'favored') {
      return '战力占优，推进主线';
    }
    if (claimableGold > 0) {
      return '先领收益，再补强阵容';
    }
    if (!recommendation) {
      return '调整阵容后再挑战';
    }
    if (recommendation.canAfford) {
      return `推荐升级 ${recommendation.cardName}`;
    }
    return `${recommendation.cardName} 还差 ${this.compactNumber(recommendation.cost - gold)} 金币`;
  }

  private primaryActionText(readiness: string, recommendation: UpgradeRecommendation | undefined, claimableGold: number, isComplete: boolean): string {
    if (isComplete) {
      return '已通关';
    }
    if (readiness === 'favored') {
      return '挑战首领';
    }
    if (claimableGold > 0) {
      return '领取收益';
    }
    return recommendation?.canAfford ? `升级 ${recommendation.cardName}` : '尝试挑战';
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
