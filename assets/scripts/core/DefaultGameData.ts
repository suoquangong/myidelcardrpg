import { CardDefinition, StageDefinition } from './GameTypes';

export const CARD_DEFINITIONS: CardDefinition[] = [
  { id: 'stone-warden', name: 'Stone Warden', role: 'tank', baseHealth: 120, baseAttack: 12, unlockStage: 0, skill: { name: 'Stone Guard', cooldown: 2, summary: '获得护盾' } },
  { id: 'ember-archer', name: 'Ember Archer', role: 'damage', baseHealth: 70, baseAttack: 25, unlockStage: 0, skill: { name: 'Ember Shot', cooldown: 2, summary: '单体爆发' } },
  { id: 'dawn-acolyte', name: 'Dawn Acolyte', role: 'support', baseHealth: 80, baseAttack: 10, unlockStage: 0, skill: { name: 'Dawn Mend', cooldown: 3, summary: '治疗阵容' } },
  { id: 'frost-mage', name: 'Frost Mage', role: 'damage', baseHealth: 68, baseAttack: 28, unlockStage: 1, skill: { name: 'Frost Burst', cooldown: 3, summary: '群体伤害' } },
  { id: 'iron-bastion', name: 'Iron Bastion', role: 'tank', baseHealth: 145, baseAttack: 9, unlockStage: 3, skill: { name: 'Iron Wall', cooldown: 3, summary: '强化防御' } },
  { id: 'night-duelist', name: 'Night Duelist', role: 'damage', baseHealth: 76, baseAttack: 32, unlockStage: 5, skill: { name: 'Night Lunge', cooldown: 2, summary: '单体突刺' } },
  { id: 'grove-mender', name: 'Grove Mender', role: 'support', baseHealth: 92, baseAttack: 8, unlockStage: 7, skill: { name: 'Grove Bloom', cooldown: 3, summary: '持续治疗' } },
  { id: 'storm-spear', name: 'Storm Spear', role: 'damage', baseHealth: 82, baseAttack: 34, unlockStage: 9, skill: { name: 'Storm Pierce', cooldown: 3, summary: '穿透伤害' } },
  { id: 'sun-paladin', name: 'Sun Paladin', role: 'tank', baseHealth: 160, baseAttack: 13, unlockStage: 11, skill: { name: 'Sun Bulwark', cooldown: 2, summary: '保护阵容' } },
  { id: 'void-oracle', name: 'Void Oracle', role: 'support', baseHealth: 88, baseAttack: 12, unlockStage: 13, skill: { name: 'Void Omen', cooldown: 3, summary: '削弱敌人' } },
  { id: 'crimson-gunner', name: 'Crimson Gunner', role: 'damage', baseHealth: 78, baseAttack: 40, unlockStage: 15, skill: { name: 'Crimson Volley', cooldown: 2, summary: '连续射击' } },
  { id: 'star-sorcerer', name: 'Star Sorcerer', role: 'damage', baseHealth: 74, baseAttack: 44, unlockStage: 17, skill: { name: 'Starfall', cooldown: 4, summary: '强力群体伤害' } },
];

export const STAGE_DEFINITIONS: StageDefinition[] = Array.from({ length: 20 }, (_, index) => {
  const stage = index + 1;
  return {
    id: stage,
    enemyName: `Stage ${stage} Guardian`,
    enemyHealth: 120 + stage * stage * 8,
    enemyAttack: 14 + stage * 7,
  };
});
