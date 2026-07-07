# Lobby UI Modernization

This file records the target direction for the Cocos lobby so the scene can move away from stacked debug cards and toward a modern idle RPG home screen.

## First Screen Goal

The lobby should feel like the player's command base, not a menu page. Keep the background art visible, then layer a small number of high-value UI zones over it.

## Recommended Layout

1. Top resource bar
   - Gold
   - Idle income rate
   - Optional premium currency placeholder

2. Hero stage area
   - Chapter name
   - Current stage
   - Enemy or boss preview
   - Main challenge button

3. Progress strip
   - Cleared stages versus total stages
   - Progress percent
   - Next hero unlock hint

4. Bottom actions
   - Heroes
   - Lineup
   - Battle
   - Bag or Shop placeholder

5. Floating idle reward claim
   - Show only when claimable rewards are greater than zero
   - Keep the button visually stronger than secondary menu entries

## LobbyController Bindings

Existing bindings still work:

- `titleLabel`
- `stageLabel`
- `powerLabel`
- `goldLabel`
- `idleRewardLabel`
- `taskLabel`
- `messageLabel`

New optional bindings:

- `chapterLabel`
- `progressLabel`
- `incomeLabel`
- `nextUnlockLabel`
- `primaryActionLabel`

## Fast Preview Path

For a quick in-editor preview, attach `ModernLobbyRuntime` to the `Canvas` node in `assets/scene/Maim.scene`.

The component creates a runtime lobby layout automatically:

- full-screen lobby background
- top resource bar
- chapter and stage panel
- main challenge button
- idle reward claim area
- bottom navigation placeholders

This is intended as the first playable lobby shell. Once the visual direction is approved, the generated nodes can be rebuilt manually in Cocos Editor or replaced with prefabs.

## Visual Direction

- Use the lobby background as the first read.
- Prefer one large stage panel over many small cards.
- Keep panels semi-transparent and shallow, with 8px or smaller radius.
- Use gold and cyan accents sparingly for state changes, reward claim, and primary action.
- Avoid dense borders, nested frames, and repeated card containers.

## Implementation Notes

- `GameCore.stageProgress()` provides chapter and progress data.
- `GameCore.idleRewardSummary()` provides claimable gold, income rate, and storage cap.
- `GameCore.nextUnlock()` provides the next hero unlock hint.
- `LobbyController` formats these into labels so the scene can stay mostly layout-only.
