import type { RotationResultMergedDamageDetail } from '@/hooks/useRotationCalculation';
import { AttackScalingProperty, CharacterStat, EnemyStat } from '@/types';

type CsvCell = number | string | undefined;

interface ExportColumn {
  key: string;
  label: string;
}

interface CharacterStatColumn extends ExportColumn {
  stat: CharacterStat;
  flat: boolean;
}

interface EnemyStatColumn extends ExportColumn {
  stat: EnemyStat;
}

const METADATA_COLUMNS: Array<ExportColumn> = [
  { key: 'attack_number', label: 'Attack #' },
  { key: 'hit_number', label: 'Hit #' },
  { key: 'character_name', label: 'Character' },
  { key: 'capability_id', label: 'Capability ID' },
  { key: 'parent_name', label: 'Parent Name' },
  { key: 'attack_name', label: 'Attack Name' },
  { key: 'origin_type', label: 'Origin Type' },
  { key: 'attribute', label: 'Attribute' },
  { key: 'damage_type', label: 'Damage Type' },
  { key: 'scaling_stat', label: 'Scaling Stat' },
  { key: 'motion_value_percent', label: 'Motion Value %' },
  {
    key: 'attack_scaling_property_value',
    label: 'Attack Scaling Property Value',
  },
  { key: 'base_damage', label: 'Base Damage' },
  { key: 'damage', label: 'Damage' },
];

const BASE_STAT_COLUMNS_BY_SCALING_STAT: Partial<
  Record<AttackScalingProperty, Array<CharacterStatColumn>>
> = {
  [AttackScalingProperty.ATK]: [
    { key: 'base_atk', label: 'Base ATK', stat: CharacterStat.ATTACK_FLAT, flat: true },
    {
      key: 'atk_percent',
      label: 'ATK %',
      stat: CharacterStat.ATTACK_SCALING_BONUS,
      flat: false,
    },
    {
      key: 'atk_flat_bonus',
      label: 'ATK Flat Bonus',
      stat: CharacterStat.ATTACK_FLAT_BONUS,
      flat: true,
    },
  ],
  [AttackScalingProperty.TUNE_RUPTURE_ATK]: [
    { key: 'base_atk', label: 'Base ATK', stat: CharacterStat.ATTACK_FLAT, flat: true },
    {
      key: 'atk_percent',
      label: 'ATK %',
      stat: CharacterStat.ATTACK_SCALING_BONUS,
      flat: false,
    },
    {
      key: 'atk_flat_bonus',
      label: 'ATK Flat Bonus',
      stat: CharacterStat.ATTACK_FLAT_BONUS,
      flat: true,
    },
  ],
  [AttackScalingProperty.HP]: [
    { key: 'base_hp', label: 'Base HP', stat: CharacterStat.HP_FLAT, flat: true },
    {
      key: 'hp_percent',
      label: 'HP %',
      stat: CharacterStat.HP_SCALING_BONUS,
      flat: false,
    },
    {
      key: 'hp_flat_bonus',
      label: 'HP Flat Bonus',
      stat: CharacterStat.HP_FLAT_BONUS,
      flat: true,
    },
  ],
  [AttackScalingProperty.TUNE_RUPTURE_HP]: [
    { key: 'base_hp', label: 'Base HP', stat: CharacterStat.HP_FLAT, flat: true },
    {
      key: 'hp_percent',
      label: 'HP %',
      stat: CharacterStat.HP_SCALING_BONUS,
      flat: false,
    },
    {
      key: 'hp_flat_bonus',
      label: 'HP Flat Bonus',
      stat: CharacterStat.HP_FLAT_BONUS,
      flat: true,
    },
  ],
  [AttackScalingProperty.DEF]: [
    {
      key: 'base_def',
      label: 'Base DEF',
      stat: CharacterStat.DEFENSE_FLAT,
      flat: true,
    },
    {
      key: 'def_percent',
      label: 'DEF %',
      stat: CharacterStat.DEFENSE_SCALING_BONUS,
      flat: false,
    },
    {
      key: 'def_flat_bonus',
      label: 'DEF Flat Bonus',
      stat: CharacterStat.DEFENSE_FLAT_BONUS,
      flat: true,
    },
  ],
  [AttackScalingProperty.TUNE_RUPTURE_DEF]: [
    {
      key: 'base_def',
      label: 'Base DEF',
      stat: CharacterStat.DEFENSE_FLAT,
      flat: true,
    },
    {
      key: 'def_percent',
      label: 'DEF %',
      stat: CharacterStat.DEFENSE_SCALING_BONUS,
      flat: false,
    },
    {
      key: 'def_flat_bonus',
      label: 'DEF Flat Bonus',
      stat: CharacterStat.DEFENSE_FLAT_BONUS,
      flat: true,
    },
  ],
};

const ALL_BASE_STAT_COLUMNS: Array<CharacterStatColumn> = [
  { key: 'base_atk', label: 'Base ATK', stat: CharacterStat.ATTACK_FLAT, flat: true },
  {
    key: 'atk_percent',
    label: 'ATK %',
    stat: CharacterStat.ATTACK_SCALING_BONUS,
    flat: false,
  },
  {
    key: 'atk_flat_bonus',
    label: 'ATK Flat Bonus',
    stat: CharacterStat.ATTACK_FLAT_BONUS,
    flat: true,
  },
  { key: 'base_hp', label: 'Base HP', stat: CharacterStat.HP_FLAT, flat: true },
  {
    key: 'hp_percent',
    label: 'HP %',
    stat: CharacterStat.HP_SCALING_BONUS,
    flat: false,
  },
  {
    key: 'hp_flat_bonus',
    label: 'HP Flat Bonus',
    stat: CharacterStat.HP_FLAT_BONUS,
    flat: true,
  },
  {
    key: 'base_def',
    label: 'Base DEF',
    stat: CharacterStat.DEFENSE_FLAT,
    flat: true,
  },
  {
    key: 'def_percent',
    label: 'DEF %',
    stat: CharacterStat.DEFENSE_SCALING_BONUS,
    flat: false,
  },
  {
    key: 'def_flat_bonus',
    label: 'DEF Flat Bonus',
    stat: CharacterStat.DEFENSE_FLAT_BONUS,
    flat: true,
  },
];

const OFFENSIVE_STAT_COLUMNS: Array<CharacterStatColumn> = [
  {
    key: 'crit_rate_percent',
    label: 'Crit Rate',
    stat: CharacterStat.CRITICAL_RATE,
    flat: false,
  },
  {
    key: 'crit_dmg_percent',
    label: 'Crit DMG',
    stat: CharacterStat.CRITICAL_DAMAGE,
    flat: false,
  },
  {
    key: 'damage_bonus_percent',
    label: 'Damage Bonus',
    stat: CharacterStat.DAMAGE_BONUS,
    flat: false,
  },
  {
    key: 'amplification_percent',
    label: 'Amplification',
    stat: CharacterStat.DAMAGE_AMPLIFICATION,
    flat: false,
  },
  {
    key: 'multiplier_bonus_percent',
    label: 'Multiplier Bonus',
    stat: CharacterStat.DAMAGE_MULTIPLIER_BONUS,
    flat: false,
  },
  {
    key: 'tune_strain_bonus_percent',
    label: 'Tune Strain Bonus',
    stat: CharacterStat.TUNE_STRAIN_DAMAGE_BONUS,
    flat: false,
  },
  {
    key: 'final_damage_bonus_percent',
    label: 'Final Damage Bonus',
    stat: CharacterStat.FINAL_DAMAGE_BONUS,
    flat: false,
  },
  {
    key: 'defense_ignore_percent',
    label: 'Defense Ignore',
    stat: CharacterStat.DEFENSE_IGNORE,
    flat: false,
  },
  {
    key: 'resistance_pen_percent',
    label: 'Resistance Pen.',
    stat: CharacterStat.RESISTANCE_PENETRATION,
    flat: false,
  },
  {
    key: 'tune_break_boost',
    label: 'Tune Break Boost',
    stat: CharacterStat.TUNE_BREAK_BOOST,
    flat: true,
  },
];

const ENEMY_STAT_COLUMNS: Array<EnemyStatColumn> = [
  {
    key: 'enemy_defense_reduction_percent',
    label: 'Defense Reduction',
    stat: EnemyStat.DEFENSE_REDUCTION,
  },
  {
    key: 'enemy_base_resistance_percent',
    label: 'Base Resistance',
    stat: EnemyStat.BASE_RESISTANCE,
  },
  {
    key: 'enemy_resistance_reduction_percent',
    label: 'Resistance Reduction',
    stat: EnemyStat.RESISTANCE_REDUCTION,
  },
];

const ROTATION_RESULT_EXPORT_COLUMNS: Array<ExportColumn> = [
  ...METADATA_COLUMNS,
  ...ALL_BASE_STAT_COLUMNS,
  ...OFFENSIVE_STAT_COLUMNS,
  ...ENEMY_STAT_COLUMNS,
];

const roundToOneDecimal = (value: number) => Math.round(value * 10) / 10;

const toExportNumber = (value: number | undefined, flat: boolean) => {
  if (value === undefined) {
    return;
  }

  return roundToOneDecimal(flat ? value : value * 100);
};

const escapeCsvValue = (value: CsvCell) => {
  if (value === undefined) {
    return '';
  }

  const stringValue = String(value);
  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n')
  ) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
};

export const buildRotationResultExportRows = (
  mergedDamageDetails: Array<RotationResultMergedDamageDetail>,
): Array<Record<string, CsvCell>> => {
  const hitCountPerAttack = new Map<number, number>();

  return mergedDamageDetails.map((detail) => {
    const hitIndex = hitCountPerAttack.get(detail.attackIndex) ?? 0;
    hitCountPerAttack.set(detail.attackIndex, hitIndex + 1);
    const row: Record<string, CsvCell> = {
      attack_number: detail.attackIndex + 1,
      hit_number: hitIndex + 1,
      character_name: detail.characterName,
      capability_id: detail.id,
      parent_name: detail.parentName,
      attack_name: detail.name,
      origin_type: detail.originType,
      attribute: detail.attribute,
      damage_type: detail.damageType,
      scaling_stat: detail.scalingStat,
      motion_value_percent: roundToOneDecimal(detail.motionValue * 100),
      attack_scaling_property_value:
        detail.character.attackScalingPropertyValue === undefined
          ? undefined
          : roundToOneDecimal(detail.character.attackScalingPropertyValue),
      base_damage: roundToOneDecimal(detail.baseDamage),
      damage: roundToOneDecimal(detail.damage),
    };

    for (const column of BASE_STAT_COLUMNS_BY_SCALING_STAT[detail.scalingStat] ?? []) {
      row[column.key] = toExportNumber(detail.character[column.stat], column.flat);
    }

    for (const column of OFFENSIVE_STAT_COLUMNS) {
      row[column.key] = toExportNumber(detail.character[column.stat], column.flat);
    }

    for (const column of ENEMY_STAT_COLUMNS) {
      row[column.key] = toExportNumber(detail.enemy[column.stat], false);
    }

    return row;
  });
};

export const buildRotationResultCsv = (
  mergedDamageDetails: Array<RotationResultMergedDamageDetail>,
) => {
  const rows = buildRotationResultExportRows(mergedDamageDetails);
  const headerRow = ROTATION_RESULT_EXPORT_COLUMNS.map((column) =>
    escapeCsvValue(column.label),
  ).join(',');
  const dataRows = rows.map((row) =>
    ROTATION_RESULT_EXPORT_COLUMNS.map((column) =>
      escapeCsvValue(row[column.key]),
    ).join(','),
  );

  return [headerRow, ...dataRows].join('\n');
};

export const downloadRotationResultCsv = (
  mergedDamageDetails: Array<RotationResultMergedDamageDetail>,
) => {
  const csv = buildRotationResultCsv(mergedDamageDetails);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = 'iris-rotation-inspector-damage-details.csv';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};
