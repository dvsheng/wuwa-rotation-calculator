export interface DamageTypeBreakdownRow {
  damageType: string;
  damage: number;
  pctOfCharacter: number;
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
    .split(/[_-]/g)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
