import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Row, Stack } from '@/components/ui/layout';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import type { StatMeta } from '@/services/rotation-calculator/client-input-adapter/adapt-client-input-to-rotation';
import type {
  ClientCharacterStats,
  ClientEnemyStats,
  ClientRotationResult,
} from '@/services/rotation-calculator/client-output-adapter/adapt-rotation-result-to-client-output';
import { AttackScalingProperty, CharacterStat, EnemyStat } from '@/types';
import type { CharacterStats, EnemyStats } from '@/types';

type DamageDetail = ClientRotationResult['damageDetails'][number];

interface AttackCalculationStatsBreakdownProperties {
  detail: DamageDetail;
}

// ---------------------------------------------------------------------------
// Value helpers
// ---------------------------------------------------------------------------

const toNumber = (value: unknown): number | undefined =>
  typeof value === 'number' ? value : undefined;

const fmtFlat = (v: number): string => Math.round(v).toLocaleString();
const fmtPct = (v: number): string => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}%`;
const fmtEnemyPct = (v: number): string => `${(v * 100).toFixed(1)}%`;
const fmtNumber = (v: number): string =>
  v.toLocaleString(undefined, {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  });
const VALUE_COLUMN_CLASS = 'w-28 shrink-0 text-right font-mono whitespace-nowrap';

// ---------------------------------------------------------------------------
// Stat section definitions
// ---------------------------------------------------------------------------

interface CharStatEntry {
  stat: CharacterStat;
  label: string;
  flat: boolean;
}

interface EnemyStatEntry {
  stat: EnemyStat;
  label: string;
}

const BASE_STAT_MAP: Partial<Record<AttackScalingProperty, Array<CharStatEntry>>> = {
  [AttackScalingProperty.ATK]: [
    { stat: CharacterStat.ATTACK_FLAT, label: 'Base ATK', flat: true },
    { stat: CharacterStat.ATTACK_SCALING_BONUS, label: 'ATK%', flat: false },
    { stat: CharacterStat.ATTACK_FLAT_BONUS, label: 'ATK Flat Bonus', flat: true },
  ],
  [AttackScalingProperty.TUNE_RUPTURE_ATK]: [
    { stat: CharacterStat.ATTACK_FLAT, label: 'Base ATK', flat: true },
    { stat: CharacterStat.ATTACK_SCALING_BONUS, label: 'ATK%', flat: false },
    { stat: CharacterStat.ATTACK_FLAT_BONUS, label: 'ATK Flat Bonus', flat: true },
  ],
  [AttackScalingProperty.HP]: [
    { stat: CharacterStat.HP_FLAT, label: 'Base HP', flat: true },
    { stat: CharacterStat.HP_SCALING_BONUS, label: 'HP%', flat: false },
    { stat: CharacterStat.HP_FLAT_BONUS, label: 'HP Flat Bonus', flat: true },
  ],
  [AttackScalingProperty.TUNE_RUPTURE_HP]: [
    { stat: CharacterStat.HP_FLAT, label: 'Base HP', flat: true },
    { stat: CharacterStat.HP_SCALING_BONUS, label: 'HP%', flat: false },
    { stat: CharacterStat.HP_FLAT_BONUS, label: 'HP Flat Bonus', flat: true },
  ],
  [AttackScalingProperty.DEF]: [
    { stat: CharacterStat.DEFENSE_FLAT, label: 'Base DEF', flat: true },
    { stat: CharacterStat.DEFENSE_SCALING_BONUS, label: 'DEF%', flat: false },
    { stat: CharacterStat.DEFENSE_FLAT_BONUS, label: 'DEF Flat Bonus', flat: true },
  ],
  [AttackScalingProperty.TUNE_RUPTURE_DEF]: [
    { stat: CharacterStat.DEFENSE_FLAT, label: 'Base DEF', flat: true },
    { stat: CharacterStat.DEFENSE_SCALING_BONUS, label: 'DEF%', flat: false },
    { stat: CharacterStat.DEFENSE_FLAT_BONUS, label: 'DEF Flat Bonus', flat: true },
  ],
};

const CHARACTER_STATS: Array<CharStatEntry> = [
  { stat: CharacterStat.CRITICAL_RATE, label: 'Crit Rate', flat: false },
  { stat: CharacterStat.CRITICAL_DAMAGE, label: 'Crit DMG', flat: false },
  { stat: CharacterStat.DAMAGE_BONUS, label: 'Damage Bonus', flat: false },
  { stat: CharacterStat.DAMAGE_AMPLIFICATION, label: 'Amplification', flat: false },
  {
    stat: CharacterStat.DAMAGE_MULTIPLIER_BONUS,
    label: 'Multiplier Bonus',
    flat: false,
  },
  {
    stat: CharacterStat.TUNE_STRAIN_DAMAGE_BONUS,
    label: 'Tune Strain Bonus',
    flat: false,
  },
  { stat: CharacterStat.FINAL_DAMAGE_BONUS, label: 'Final Damage Bonus', flat: false },
  { stat: CharacterStat.DEFENSE_IGNORE, label: 'Defense Ignore', flat: false },
  { stat: CharacterStat.RESISTANCE_PENETRATION, label: 'Resistance Pen.', flat: false },
  { stat: CharacterStat.TUNE_BREAK_BOOST, label: 'Tune Break Boost', flat: true },
];

const ENEMY_STATS: Array<EnemyStatEntry> = [
  { stat: EnemyStat.DEFENSE_REDUCTION, label: 'Defense Reduction' },
  { stat: EnemyStat.BASE_RESISTANCE, label: 'Base Resistance' },
  { stat: EnemyStat.RESISTANCE_REDUCTION, label: 'Resistance Reduction' },
];

// ---------------------------------------------------------------------------
// Data builders
// ---------------------------------------------------------------------------

interface ContributorGroup {
  statLabel: string;
  stat: CharacterStat | EnemyStat;
  flat: boolean;
  entries: Array<ContributorEntry>;
}

interface ContributorEntry {
  name: string;
  description: string;
  value: number | undefined;
  flat: boolean;
}

const sortContributorsByValueDesc = (
  entries: Array<ContributorEntry>,
): Array<ContributorEntry> =>
  entries.toSorted((a, b) => {
    if (a.value === undefined && b.value === undefined) {
      return 0;
    }
    if (a.value === undefined) {
      return 1;
    }
    if (b.value === undefined) {
      return -1;
    }
    return b.value - a.value;
  });

const buildCharContributors = (
  stats: CharacterStats<StatMeta>,
  statEntries: Array<CharStatEntry>,
): Array<ContributorGroup> =>
  statEntries
    .map(({ stat, label, flat }) => ({
      statLabel: label,
      stat,
      flat,
      entries: sortContributorsByValueDesc(
        stats[stat].map((sv) => ({
          name: sv.name,
          description: sv.description,
          value: toNumber(sv.value),
          flat,
        })),
      ),
    }))
    .filter(({ entries }) => entries.length > 0);

const buildEnemyContributors = (
  stats: EnemyStats<StatMeta>,
  statEntries: Array<EnemyStatEntry>,
): Array<ContributorGroup> =>
  statEntries
    .map(({ stat, label }) => ({
      statLabel: label,
      stat,
      flat: false,
      entries: sortContributorsByValueDesc(
        stats[stat].map((sv) => ({
          name: sv.name,
          description: sv.description,
          value: toNumber(sv.value),
          flat: false,
        })),
      ),
    }))
    .filter(({ entries }) => entries.length > 0);

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const SectionLabel = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <Text as="p" className={className}>
    {children}
  </Text>
);

const ContributorRow = ({
  name,
  description,
  value,
  flat,
  enemy,
}: {
  name: string;
  description: string;
  value: number | undefined;
  flat: boolean;
  enemy?: boolean;
}) => (
  <Row justify="between">
    <Stack className="min-w-0 flex-1">
      <Text as="p" variant="caption" tone="muted">
        <Text as="span" variant="caption" tone="muted" className="font-semibold">
          {name}
        </Text>{' '}
        - {description}
      </Text>
    </Stack>
    <Text
      as="span"
      variant="caption"
      tone="muted"
      tabular={true}
      className={VALUE_COLUMN_CLASS}
    >
      {value === undefined
        ? 'Variable'
        : enemy
          ? fmtEnemyPct(value)
          : flat
            ? fmtFlat(value)
            : fmtPct(value)}
    </Text>
  </Row>
);

const formatTotalValue = ({
  value,
  flat,
  enemy,
}: {
  value: number | undefined;
  flat: boolean;
  enemy?: boolean;
}) => {
  if (value === undefined) {
    return '--';
  }
  return enemy ? fmtEnemyPct(value) : flat ? fmtFlat(value) : fmtPct(value);
};

const StatValueRow = ({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) => (
  <Row justify="between">
    <Text as="span" variant="bodySm" tone="muted">
      {label}
    </Text>
    <Text
      as="span"
      variant="bodySm"
      tone="muted"
      tabular={true}
      className={cn(VALUE_COLUMN_CLASS, valueClassName)}
    >
      {value}
    </Text>
  </Row>
);

// Renders contributors + per-stat total as accordion sections (one item per stat)
const GroupList = ({
  groups,
  clientStats,
  enemy,
}: {
  groups: Array<ContributorGroup>;
  clientStats: ClientCharacterStats | ClientEnemyStats;
  enemy?: boolean;
}) => (
  <Accordion type="multiple">
    {groups.map((group) => {
      const total = (clientStats as Record<string, number | undefined>)[group.stat];
      return (
        <AccordionItem key={group.statLabel} value={`${group.stat}-${group.statLabel}`}>
          <AccordionTrigger className="py-2">
            <Row justify="between" fullWidth className="pr-2">
              <Text as="span" variant="bodySm" tone="muted">
                {group.statLabel}
              </Text>
              <Text
                as="span"
                variant="bodySm"
                tone="muted"
                tabular={true}
                className={VALUE_COLUMN_CLASS}
              >
                {formatTotalValue({ value: total, flat: group.flat, enemy })}
              </Text>
            </Row>
          </AccordionTrigger>
          <AccordionContent className="w-full pr-10 pb-3">
            <Stack>
              {group.entries.map((entry, index) => (
                <ContributorRow
                  key={`${entry.name}-${index}`}
                  {...entry}
                  enemy={enemy}
                />
              ))}
            </Stack>
          </AccordionContent>
        </AccordionItem>
      );
    })}
  </Accordion>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const AttackCalculationStatsBreakdown = ({
  detail,
}: AttackCalculationStatsBreakdownProperties) => {
  const characterStats = detail.teamDetails[detail.characterIndex];
  const enemyStats = detail.enemyDetails;
  const clientChar = detail.character;
  const clientEnemy = detail.enemy;

  const baseGroups = buildCharContributors(
    characterStats,
    BASE_STAT_MAP[detail.scalingStat] ?? [],
  );
  const characterGroups = buildCharContributors(characterStats, CHARACTER_STATS);
  const enemyGroups = buildEnemyContributors(enemyStats, ENEMY_STATS);
  return (
    <Stack gap="inset" fullWidth>
      <Text variant="heading" className="border-border border-b">
        Stat Breakdown
      </Text>
      <ScrollArea className="min-h-0 flex-1">
        <Stack>
          <section>
            <SectionLabel>Damage Summary</SectionLabel>
            <Stack className="gap-inset pb-component pr-10">
              <StatValueRow
                label="Motion Value"
                value={`${(detail.motionValue * 100).toFixed(1)}%`}
              />
              <StatValueRow
                label="Attack Scaling Property Value"
                value={
                  clientChar.attackScalingPropertyValue === undefined
                    ? '--'
                    : fmtNumber(clientChar.attackScalingPropertyValue)
                }
              />
              <StatValueRow label="Base Damage" value={fmtNumber(detail.baseDamage)} />
              <StatValueRow
                label="Damage"
                value={fmtNumber(detail.damage)}
                valueClassName="text-foreground"
              />
            </Stack>
          </section>
          {baseGroups.length > 0 && (
            <section>
              <SectionLabel>Motion Value Scaling Stat</SectionLabel>
              <GroupList groups={baseGroups} clientStats={clientChar} />
            </section>
          )}
          {characterGroups.length > 0 && (
            <section>
              <SectionLabel>Offensive Multipliers</SectionLabel>
              {characterGroups.length > 0 && (
                <GroupList groups={characterGroups} clientStats={clientChar} />
              )}
            </section>
          )}
          {enemyGroups.length > 0 && (
            <section>
              <SectionLabel>Enemy</SectionLabel>
              <GroupList groups={enemyGroups} clientStats={clientEnemy} enemy />
            </section>
          )}
        </Stack>
      </ScrollArea>
    </Stack>
  );
};
