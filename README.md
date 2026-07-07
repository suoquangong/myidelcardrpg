# Idle Card RPG Cocos

Cocos Creator 3.8.8 prototype for a vertical idle card RPG.

## Project Status

This repository is the Cocos migration branch of the original SwiftUI prototype.

Implemented in this round:

- TypeScript gameplay core
- Local save service
- Card, stage, and asset JSON data
- First-pass Cocos UI controller scripts
- Temporary card, enemy, lobby, and battle art assets
- Lobby view-model summaries for stage progress, idle rewards, and next hero unlocks
- Runtime-generated modern lobby shell via `ModernLobbyRuntime`
- Modern lobby binding guide in `docs/LOBBY_UI_MODERNIZATION.md`
- Vertical design resolution: `720 x 1560`

## Open In Cocos Creator

1. Open Cocos Dashboard.
2. Import this project folder.
3. Open with Cocos Creator `3.8.8`.
4. Open `assets/scene/Maim.scene`.
5. Attach `ModernLobbyRuntime` to `Canvas` for a quick generated lobby preview.

## Important Git Notes

Do not commit generated Cocos folders:

- `library/`
- `temp/`
- `local/`
- `build/`
- `profiles/`

Core project files live in:

- `assets/`
- `settings/`
- `.creator/`
- `package.json`
- `tsconfig.json`
- `docs/`
