# Cocos Editor Setup

本轮迁移已经把玩法核心、存档、UI 控制脚本和临时美术资源放入 Cocos 工程。

## 推荐场景结构

在 `assets/scene/Maim.scene` 的 `Canvas` 下先搭一个简单竖屏大厅：

```text
Canvas
  Background
  TopBar
    StageLabel
    PowerLabel
    GoldLabel
  MapLayer
    ChallengeButton
    RewardButton
  LineupPanel
    LineupLabel1
    LineupLabel2
    LineupLabel3
  MessageLabel
```

## 绑定 LobbyController

1. 在 `Canvas` 或 `LobbyRoot` 节点上添加 `LobbyController`。
2. 将 Label 拖到对应属性：
   - `stageLabel`
   - `powerLabel`
   - `goldLabel`
   - `idleRewardLabel`
   - `taskLabel`
   - `messageLabel`
3. `RewardButton` 的 Click Event 绑定：
   - Node: 挂有 `LobbyController` 的节点
   - Component: `LobbyController`
   - Handler: `claimIdleRewards`
4. `ChallengeButton` 的 Click Event 绑定：
   - Handler: `challengeCurrentStage`

## 绑定图片

如果想用代码加载图片：

1. 给 Sprite 节点添加 `ResourceSprite`。
2. `spriteFramePath` 填：
   - 大厅背景：`art/backgrounds/home-lobby-skyhaven/spriteFrame`
   - 战斗背景：`art/backgrounds/battle-sky-ruins/spriteFrame`
   - Stone Warden：`art/cards/card-stone-warden/spriteFrame`

这些路径来自 `assets/resources/art`。

## 绑定卡牌升级

给卡牌页根节点添加 `CardListController`：

- `cardLabels` 填一组 Label，用于显示卡牌信息。
- 升级按钮 Click Event 绑定 `upgradeCard`。
- 如果按钮要升级指定卡牌，在 CustomEventData 填卡牌 id，例如 `stone-warden`。

## 绑定阵容

给阵容页根节点添加 `LineupController`：

- `lineupLabels` 显示当前 3 人阵容。
- `candidateLabels` 显示已解锁候选卡牌。
- 候选按钮 Click Event 绑定 `toggleCard`。
- CustomEventData 填卡牌 id，例如 `ember-archer`。

## 绑定战斗

给战斗页根节点添加 `BattleController`：

- `headerLabel`
- `playerHpLabel`
- `enemyHpLabel`
- `logLabel`

战斗按钮 Click Event 绑定 `runBattle`。

## 本轮新增目录

```text
assets/
  data/
  resources/art/
  scripts/core/
  scripts/services/
  scripts/ui/
docs/
  EDITOR_SETUP.md
```
