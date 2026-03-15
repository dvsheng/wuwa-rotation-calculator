export interface DamageTypeBreakdownRow {
  damageType: string;
  damage: number;
  pctOfCharacter: number;
  attacks: Array<CharacterAttackBreakdownRow>;
}

export interface CharacterAttackBreakdownRow {
  attackIndex: number;
  attackName: string;
  damage: number;
  pctOfCharacter: number;
  pctOfDamageType: number;
}

export interface CharacterBreakdownRow {
  characterName: string;
  iconUrl?: string;
  totalDamage: number;
  pctOfTotal: number;
  damageTypes: Array<DamageTypeBreakdownRow>;
}

export const toDisplayName = (value: string) =>
  value
    .replaceAll(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[_-]/g)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
