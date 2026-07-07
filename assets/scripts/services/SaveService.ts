import { sys } from 'cc';
import { GameCore } from '../core/GameCore';
import { GameState } from '../core/GameTypes';

const SAVE_KEY = 'idle-card-rpg-save-v1';

export class SaveService {
  static load(): GameState {
    const raw = sys.localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return GameCore.newGame();
    }

    try {
      const state = JSON.parse(raw) as GameState;
      GameCore.repairLineup(state);
      return state;
    } catch {
      return GameCore.newGame();
    }
  }

  static save(state: GameState): void {
    sys.localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }

  static reset(): GameState {
    const state = GameCore.newGame();
    this.save(state);
    return state;
  }
}
