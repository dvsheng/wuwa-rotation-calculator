import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { RotationResultMergedDamageDetail } from '@/hooks/useRotationCalculation';
import { OriginType } from '@/services/game-data';
import { SensitivityAnalysisCategory } from '@/services/rotation-calculator/client-output-adapter/adapt-rotation-result-to-client-output';
import type { ClientRotationResult } from '@/services/rotation-calculator/client-output-adapter/adapt-rotation-result-to-client-output';
import { AttackScalingProperty, CharacterStat, DamageType, EnemyStat } from '@/types';
import type { CharacterStats, EnemyStats } from '@/types';

import { RotationResultContainer } from './RotationResultContainer';

vi.mock('@/hooks/useRotationCalculation');

const { useRotationCalculation } = await import('@/hooks/useRotationCalculation');
const mockUseRotationCalculation = vi.mocked(useRotationCalculation);
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const createCharacterStats = (): CharacterStats => {
  const stats = Object.fromEntries(
    Object.values(CharacterStat).map((stat) => [stat, []]),
  ) as unknown as CharacterStats;
  stats[CharacterStat.ATTACK_FLAT] = [
    {
      name: 'Base Attack',
      description: 'Base attack stat',
      value: 1200,
      tags: [],
    } as unknown as CharacterStats[typeof CharacterStat.ATTACK_FLAT][number],
  ];
  stats[CharacterStat.CRITICAL_RATE] = [
    {
      name: 'Crit Rate',
      description: 'Crit rate bonus',
      value: 0.15,
      tags: [],
    } as unknown as CharacterStats[typeof CharacterStat.CRITICAL_RATE][number],
  ];
  return stats;
};

const createEnemyStats = (): EnemyStats => {
  const stats = Object.fromEntries(
    Object.values(EnemyStat).map((stat) => [stat, []]),
  ) as unknown as EnemyStats;
  stats[EnemyStat.BASE_RESISTANCE] = [
    {
      name: 'Enemy Resistance',
      description: 'Base resistance',
      value: 0.1,
      tags: [],
    } as unknown as EnemyStats[typeof EnemyStat.BASE_RESISTANCE][number],
  ];
  return stats;
};

const createMergedDamageDetail = ({
  attackIndex,
  characterIndex,
  characterName,
  damage,
  damageType,
  originType,
}: {
  attackIndex: number;
  characterIndex: number;
  characterName: string;
  damage: number;
  damageType: string;
  originType: string;
}): RotationResultMergedDamageDetail =>
  ({
    detail: {
      attackIndex,
      characterIndex,
      scalingStat: AttackScalingProperty.ATK,
      motionValue: 1.2,
      damage,
      baseDamage: damage * 0.7,
      character: {
        attackScalingPropertyValue: 1200,
        [CharacterStat.ATTACK_FLAT]: 1200,
        [CharacterStat.CRITICAL_RATE]: 0.15,
      },
      enemy: {
        [EnemyStat.BASE_RESISTANCE]: 0.1,
      },
      teamDetails: [
        createCharacterStats(),
        createCharacterStats(),
        createCharacterStats(),
      ],
      enemyDetails: createEnemyStats(),
    },
    attack: {
      id: attackIndex + 1,
      name: `${characterName} Attack ${attackIndex + 1}`,
      parentName: originType,
      originType,
      capabilityType: 'attack',
      characterName,
      characterIconUrl: `/icons/${characterName}.png`,
      damageInstances: [{ damageType }],
    },
  }) as unknown as RotationResultMergedDamageDetail;

const createResult = (): ClientRotationResult & {
  mergedDamageDetails: Array<RotationResultMergedDamageDetail>;
  attackCount: number;
} => ({
  totalDamage: 123_456,
  damageDetails: [
    createMergedDamageDetail({
      attackIndex: 0,
      characterIndex: 0,
      characterName: 'Sigrika',
      damage: 60_000,
      damageType: DamageType.BASIC_ATTACK,
      originType: OriginType.NORMAL_ATTACK,
    }).detail,
    createMergedDamageDetail({
      attackIndex: 1,
      characterIndex: 0,
      characterName: 'Sigrika',
      damage: 40_000,
      damageType: DamageType.RESONANCE_SKILL,
      originType: OriginType.FORTE_CIRCUIT,
    }).detail,
    createMergedDamageDetail({
      attackIndex: 2,
      characterIndex: 1,
      characterName: 'Carlotta',
      damage: 23_456,
      damageType: DamageType.RESONANCE_LIBERATION,
      originType: OriginType.RESONANCE_LIBERATION,
    }).detail,
  ],
  mergedDamageDetails: [
    createMergedDamageDetail({
      attackIndex: 0,
      characterIndex: 0,
      characterName: 'Sigrika',
      damage: 60_000,
      damageType: DamageType.BASIC_ATTACK,
      originType: OriginType.NORMAL_ATTACK,
    }),
    createMergedDamageDetail({
      attackIndex: 1,
      characterIndex: 0,
      characterName: 'Sigrika',
      damage: 40_000,
      damageType: DamageType.RESONANCE_SKILL,
      originType: OriginType.FORTE_CIRCUIT,
    }),
    createMergedDamageDetail({
      attackIndex: 2,
      characterIndex: 1,
      characterName: 'Carlotta',
      damage: 23_456,
      damageType: DamageType.RESONANCE_LIBERATION,
      originType: OriginType.RESONANCE_LIBERATION,
    }),
  ],
  attackCount: 3,
  sensitivityAnalysis: {
    baselineTotalDamage: 123_456,
    characterIndex: 0,
    scenarios: [
      {
        id: 'substat:crit_rate',
        category: SensitivityAnalysisCategory.SUBSTAT_ROLL,
        label: '+1 Crit Rate roll',
        description: 'Adds one extra 7.5 Crit Rate substat roll to character 1.',
        perturbedTotalDamage: 126_000,
        totalDamageDelta: 2544,
        relativeDelta: 0.0206,
      },
    ],
  },
});

const createEmptyResult = (): ClientRotationResult & {
  mergedDamageDetails: Array<RotationResultMergedDamageDetail>;
  attackCount: number;
} => ({
  totalDamage: 0,
  damageDetails: [],
  mergedDamageDetails: [],
  attackCount: 0,
  sensitivityAnalysis: {
    baselineTotalDamage: 0,
    characterIndex: 0,
    scenarios: [],
  },
});

describe('RotationResultContainer', () => {
  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation((message) => {
      if (
        typeof message === 'string' &&
        message.includes('The width(0) and height(0) of chart should be greater than 0')
      ) {
        return;
      }
    });
    mockUseRotationCalculation.mockReturnValue({
      data: createResult(),
      isStale: false,
    } as unknown as ReturnType<typeof useRotationCalculation>);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders the summary tab by default with summary sections and neutral details state', () => {
    render(<RotationResultContainer />);

    expect(screen.getByRole('tab', { name: 'Summary' })).toHaveAttribute(
      'data-state',
      'active',
    );
    expect(screen.getByText('Damage by Character')).toBeInTheDocument();
    expect(screen.getByText('Skill Origin Distribution')).toBeInTheDocument();
    expect(screen.getByText('Damage by Type')).toBeInTheDocument();
    expect(screen.getByText('Substat Sensitivity')).toBeInTheDocument();
  });

  it('renders summary empty states when no summary data exists', () => {
    mockUseRotationCalculation.mockReturnValue({
      data: createEmptyResult(),
      isStale: false,
    } as unknown as ReturnType<typeof useRotationCalculation>);

    render(<RotationResultContainer />);

    expect(screen.getByText('No character damage data available.')).toBeInTheDocument();
    expect(
      screen.getByText('Team slot 1 has no recorded damage in this rotation.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('No damage type data is available for this rotation.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'No substat sensitivity scenarios are available for this rotation.',
      ),
    ).toBeInTheDocument();
  });

  it('renders attack details when an attack row detail button is selected', async () => {
    render(<RotationResultContainer />);

    await userEvent.click(screen.getByRole('tab', { name: 'By Attack' }));
    expect(screen.getByText('No Detail Selected')).toBeInTheDocument();

    await userEvent.click(screen.getAllByLabelText('Open damage details inspector')[0]);

    expect(screen.getByText('Stat Breakdown')).toBeInTheDocument();
  });

  it('renders the character breakdown inspector when a character info button is selected', async () => {
    render(<RotationResultContainer />);

    await userEvent.click(screen.getByRole('tab', { name: 'By Character' }));
    expect(
      screen.getByText(
        "Click the info icon to view a character's attack breakdown by damage type.",
      ),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getAllByLabelText('Open character attack breakdown')[0],
    );

    expect(
      screen.queryByText(
        "Click the info icon to view a character's attack breakdown by damage type.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText('Sigrika').length).toBeGreaterThan(1);
    expect(screen.getAllByText('Basic Attack').length).toBeGreaterThan(1);
    expect(screen.getByText('Sigrika Attack 1')).toBeInTheDocument();
  });

  it('renders the sensitivity tab and updates details when a row is selected', async () => {
    render(<RotationResultContainer />);

    await userEvent.click(screen.getByRole('tab', { name: 'Sensitivity' }));

    expect(screen.getByText('Substat Rolls')).toBeInTheDocument();
    expect(screen.getByText('+1 Crit Rate roll')).toBeInTheDocument();
    expect(screen.getByText('No Scenario Selected')).toBeInTheDocument();

    await userEvent.click(screen.getByText('+1 Crit Rate roll'));

    expect(screen.getByText('Sensitivity Scenario')).toBeInTheDocument();
    expect(
      screen.getAllByText('Adds one extra 7.5 Crit Rate substat roll to character 1.'),
    ).toHaveLength(2);
    expect(screen.getByText('126,000')).toBeInTheDocument();
  });
});
