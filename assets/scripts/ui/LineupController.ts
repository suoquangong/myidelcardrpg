import { _decorator, Component, Label } from 'cc';
import { GameCore } from '../core/GameCore';
import { GameStore } from '../services/GameStore';

const { ccclass, property } = _decorator;

@ccclass('LineupController')
export class LineupController extends Component {
  @property([Label])
  lineupLabels: Label[] = [];

  @property([Label])
  candidateLabels: Label[] = [];

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

  toggleCard(_event?: unknown, customEventData?: string): void {
    if (customEventData) {
      this.store.toggleLineupCard(customEventData);
    }
  }

  refresh(): void {
    const state = this.store.state;
    const lineup = GameCore.repairedLineupIDs(state);
    const cards = GameCore.unlockedCards(state);

    for (let index = 0; index < this.lineupLabels.length; index += 1) {
      const cardID = lineup[index];
      const card = cards.find((item) => item.id === cardID);
      this.lineupLabels[index].string = card ? `${index + 1}. ${card.name} Lv.${state.cardLevels[card.id] ?? 1}` : '空位';
    }

    for (let index = 0; index < this.candidateLabels.length; index += 1) {
      const card = cards[index];
      const isInLineup = card ? state.lineupCardIDs.includes(card.id) : false;
      this.candidateLabels[index].string = card ? `${isInLineup ? '✓' : '+'} ${card.name}` : '';
    }

    if (this.messageLabel) {
      this.messageLabel.string = this.store.lastMessage;
    }
  }
}
