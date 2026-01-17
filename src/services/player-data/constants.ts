export const AKASHA_STAT_KEYS = {
  critRate: 'critRate',
  critDamage: 'critDamage',
  energyRecharge: 'energyRecharge',
  healingBonus: 'healingBonus',
  incomingHealingBonus: 'incomingHealingBonus',
  elementalMastery: 'elementalMastery',
  physicalDamageBonus: 'physicalDamageBonus',
  geoDamageBonus: 'geoDamageBonus',
  cryoDamageBonus: 'cryoDamageBonus',
  pyroDamageBonus: 'pyroDamageBonus',
  anemoDamageBonus: 'anemoDamageBonus',
  hydroDamageBonus: 'hydroDamageBonus',
  dendroDamageBonus: 'dendroDamageBonus',
  electroDamageBonus: 'electroDamageBonus',
  maxHp: 'maxHp',
  atk: 'atk',
  def: 'def',
} as const;

export type AkashaStatKey = (typeof AKASHA_STAT_KEYS)[keyof typeof AKASHA_STAT_KEYS];
