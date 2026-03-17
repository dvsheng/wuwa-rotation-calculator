import {
  arrange,
  desc,
  distinct,
  filter,
  first,
  groupBy,
  map,
  sum,
  summarize,
  tidy,
} from '@tidyjs/tidy';

import type { RotationResultMergedDamageDetail } from '@/hooks/useRotationCalculation';

import type { AttackGroup, HitRow } from './AttackBreakdownRowDropdown';
import type { CharacterBreakdownRow } from './character-breakdown.types';

type DamageRow = RotationResultMergedDamageDetail;

// ---------------------------------------------------------------------------
// attackGroups — group damage instances by attack index with hit tracking
// ---------------------------------------------------------------------------

export const attackGroups = (data: Array<DamageRow>): Array<AttackGroup> => {
  const hitCountPerAttack = new Map<number, number>();

  const withHitIndex = tidy(
    data,
    map((d) => {
      const hitIndex = hitCountPerAttack.get(d.attackIndex) ?? 0;
      hitCountPerAttack.set(d.attackIndex, hitIndex + 1);
      return { ...d, _hitIndex: hitIndex };
    }),
  );

  return tidy(
    withHitIndex,
    groupBy('attackIndex', [
      summarize({
        attackIndex: first('attackIndex'),
        attack: first((d) => d as DamageRow),
        characterName: first('characterName'),
        totalDamage: sum('damage'),
        hits: (items: Array<DamageRow & { _hitIndex: number }>) =>
          items.map(
            (d): HitRow => ({
              hitIndex: d._hitIndex,
              detail: d,
              damage: d.damage,
            }),
          ),
      }),
    ]),
  ) as Array<AttackGroup>;
};

// ---------------------------------------------------------------------------
// attackCount — distinct attack count from merged damage details
// ---------------------------------------------------------------------------

export const attackCount = (data: Array<DamageRow>): number =>
  tidy(data, distinct(['attackIndex'])).length;

// ---------------------------------------------------------------------------
// characterBreakdown — full character → damageType → attack hierarchy
// ---------------------------------------------------------------------------

export const characterBreakdown = (
  data: Array<DamageRow>,
): Array<CharacterBreakdownRow> => {
  const overallTotal = tidy(data, summarize({ damage: sum('damage') }))[0]?.damage ?? 0;

  return tidy(
    data,
    groupBy('characterIndex', [
      summarize({
        characterIndex: first('characterIndex'),
        characterName: first('characterName'),
        iconUrl: first('characterIconUrl'),
        totalDamage: sum('damage'),
      }),
    ]),
    arrange([desc('totalDamage')]),
  ).map((character) => {
    const charRows = tidy(
      data,
      filter((d) => d.characterIndex === character.characterIndex),
    );
    const charTotal = character.totalDamage;

    return {
      characterName: character.characterName,
      iconUrl: character.iconUrl as string | undefined,
      totalDamage: charTotal,
      pctOfTotal: overallTotal === 0 ? 0 : (charTotal / overallTotal) * 100,
      damageTypes: tidy(
        charRows,
        groupBy('damageType', [summarize({ damage: sum('damage') })]),
        arrange([desc('damage')]),
      ).map((dt) => {
        const dtDamage = dt.damage;
        return {
          damageType: dt.damageType,
          damage: dtDamage,
          pctOfCharacter: charTotal === 0 ? 0 : (dtDamage / charTotal) * 100,
          attacks: tidy(
            charRows,
            filter((d) => d.damageType === dt.damageType),
            groupBy('name', [summarize({ damage: sum('damage') })]),
            arrange([desc('damage')]),
          ).map((attack) => {
            const attackDamage = attack.damage;
            return {
              attackIndex: 0,
              attackName: attack.name,
              damage: attackDamage,
              pctOfDamageType: dtDamage === 0 ? 0 : (attackDamage / dtDamage) * 100,
              pctOfCharacter: charTotal === 0 ? 0 : (attackDamage / charTotal) * 100,
            };
          }),
        };
      }),
    };
  });
};
