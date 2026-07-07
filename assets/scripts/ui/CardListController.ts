import { _decorator, Component, Label } from 'cc';
import { CardDefinition } from '../core/GameTypes';
import { GameCore } from '../core/GameCore';
import { GameStore } from '../services/GameStore';

const { ccclass, property } = _decorator;

@ccclass('CardListController')
export class CardListController extends Component {
  @property([Label])
  cardLabels: Label[] = [];

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

  upgradeCard(_event?: unknown, customEventData?: string): void {
    const cardID = customEventData ?? this.firstUnlockedCardID();
    if (cardID) {
      this.store.upgradeCard(cardID);
    }
  }

  refresh(): void {
    const cards = GameCore.unlockedCards(this.store.state);
    for (let index = 0; index < this.cardLabels.length; index += 1) {
      const card = cards[index];
      this.cardLabels[index].string = card ? this.cardText(card) : '';
    }
    if (this.messageLabel) {
      this.messageLabel.string = this.store.lastMessage;
    }
  }

  private firstUnlockedCardID(): string | undefined {
    return GameCore.unlockedCards(this.store.state)[0]?.id;
  }

  private cardText(card: CardDefinition): string {
    const state = this.store.state;
    const level = state.cardLevels[card.id] ?? 1;
    const stats = GameCore.stats(card.id, state);
    const cost = GameCore.upgradeCost(card.id, state);
    const lineupMark = state.lineupCardIDs.includes(card.id) ? '出战' : '候补';
    return `${card.name}  Lv.${level}  ${lineupMark}\nHP ${stats?.health ?? 0} / ATK ${stats?.attack ?? 0}  升级 ${cost}`;
  }
}
