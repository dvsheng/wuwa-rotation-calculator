import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { RotationResultMergedDamageDetail } from '@/hooks/useRotationCalculation';
import { OriginType } from '@/services/game-data';
import { SensitivityAnalysisCategory } from '@/services/rotation-calculator/client-output-adapter/adapt-rotation-result-to-client-output';
import type { ClientSensitivityAnalysis } from '@/services/rotation-calculator/client-output-adapter/adapt-rotation-result-to-client-output';
import { DamageType } from '@/types';

import { useCharacterBreakdown } from './useCharacterBreakdown';
import { useFirstCharacterSkillOriginDistribution } from './useFirstCharacterSkillOriginDistribution';
import { useSensitivityAnalysisBreakdown } from './useSensitivityAnalysisBreakdown';

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
      motionValue: 1,
      damage,
      baseDamage: damage,
      scalingStat: 'atk',
      character: {},
      enemy: {},
      teamDetails: [],
      enemyDetails: {},
    },
    attack: {
      id: attackIndex + 1,
      name: `${characterName} Attack ${attackIndex + 1}`,
      originType,
      parentName: originType,
      capabilityType: 'attack',
      damageInstances: [{ damageType }],
      characterName,
    },
  }) as unknown as RotationResultMergedDamageDetail;

const createSensitivityAnalysis = (): ClientSensitivityAnalysis => ({
  baselineTotalDamage: 1000,
  characterIndex: 0,
  scenarios: [
    {
      id: 'substat:crit_rate',
      category: SensitivityAnalysisCategory.SUBSTAT_ROLL,
      label: '+1 Crit Rate roll',
      description: 'Crit Rate roll',
      perturbedTotalDamage: 1100,
      totalDamageDelta: 100,
      relativeDelta: 0.1,
    },
    {
      id: 'substat:atk_percent',
      category: SensitivityAnalysisCategory.SUBSTAT_ROLL,
      label: '+1 Atk Percent roll',
      description: 'Atk Percent roll',
      perturbedTotalDamage: 1075,
      totalDamageDelta: 75,
      relativeDelta: 0.075,
    },
    {
      id: 'swap:3-cost',
      category: SensitivityAnalysisCategory.THREE_COST_MAIN_STAT_SWAP,
      label: '3-Cost Swap',
      description: '3-cost swap',
      perturbedTotalDamage: 1040,
      totalDamageDelta: 40,
      relativeDelta: 0.04,
    },
  ],
});

describe('result breakdown hooks', () => {
  it('builds character totals and percentages from merged damage details', () => {
    const mergedDamageDetails = [
      createMergedDamageDetail({
        attackIndex: 0,
        characterIndex: 0,
        characterName: 'Sigrika',
        damage: 600,
        damageType: DamageType.RESONANCE_SKILL,
        originType: OriginType.RESONANCE_SKILL,
      }),
      createMergedDamageDetail({
        attackIndex: 1,
        characterIndex: 0,
        characterName: 'Sigrika',
        damage: 400,
        damageType: DamageType.BASIC_ATTACK,
        originType: OriginType.NORMAL_ATTACK,
      }),
      createMergedDamageDetail({
        attackIndex: 2,
        characterIndex: 1,
        characterName: 'Carlotta',
        damage: 1000,
        damageType: DamageType.RESONANCE_LIBERATION,
        originType: OriginType.RESONANCE_LIBERATION,
      }),
    ];

    const { result } = renderHook(() =>
      useCharacterBreakdown({ mergedDamageDetails, totalDamage: 2000 }),
    );

    expect(result.current.rows).toHaveLength(2);
    const sigrikaRow = result.current.rows.find(
      (row) => row.characterName === 'Sigrika',
    );
    const carlottaRow = result.current.rows.find(
      (row) => row.characterName === 'Carlotta',
    );

    expect(carlottaRow).toMatchObject({
      characterName: 'Carlotta',
      totalDamage: 1000,
      pctOfTotal: 50,
    });
    expect(sigrikaRow).toMatchObject({
      characterName: 'Sigrika',
      totalDamage: 1000,
      pctOfTotal: 50,
    });
    expect(sigrikaRow?.damageTypes[0]).toMatchObject({
      damageType: DamageType.RESONANCE_SKILL,
      damage: 600,
      pctOfCharacter: 60,
    });
    expect(result.current.chartData.map((entry) => entry.label).toSorted()).toEqual([
      'Carlotta',
      'Sigrika',
    ]);
  });

  it('isolates and sorts substat sensitivity scenarios for summary charts', () => {
    const sensitivityAnalysis = createSensitivityAnalysis();

    const { result } = renderHook(() =>
      useSensitivityAnalysisBreakdown(sensitivityAnalysis),
    );

    expect(result.current.sections).toHaveLength(2);
    expect(result.current.sections[0]?.title).toBe('Substat Rolls');
    expect(result.current.substatChartData).toHaveLength(2);
    expect(result.current.substatChartData.map((entry) => entry.id)).toEqual([
      'substat:crit_rate',
      'substat:atk_percent',
    ]);
    expect(result.current.substatChartData[0]?.value).toBe(0.1);
  });

  it('groups team slot 1 damage into the supported skill-origin buckets', () => {
    const mergedDamageDetails = [
      createMergedDamageDetail({
        attackIndex: 0,
        characterIndex: 0,
        characterName: 'Sigrika',
        damage: 690,
        damageType: DamageType.RESONANCE_SKILL,
        originType: OriginType.FORTE_CIRCUIT,
      }),
      createMergedDamageDetail({
        attackIndex: 1,
        characterIndex: 0,
        characterName: 'Sigrika',
        damage: 159,
        damageType: DamageType.RESONANCE_LIBERATION,
        originType: OriginType.RESONANCE_LIBERATION,
      }),
      createMergedDamageDetail({
        attackIndex: 2,
        characterIndex: 0,
        characterName: 'Sigrika',
        damage: 51,
        damageType: DamageType.ECHO,
        originType: OriginType.ECHO,
      }),
      createMergedDamageDetail({
        attackIndex: 3,
        characterIndex: 1,
        characterName: 'Carlotta',
        damage: 800,
        damageType: DamageType.BASIC_ATTACK,
        originType: OriginType.NORMAL_ATTACK,
      }),
    ];

    const { result } = renderHook(() =>
      useFirstCharacterSkillOriginDistribution(mergedDamageDetails),
    );

    expect(result.current.characterName).toBe('Sigrika');
    expect(result.current.rows).toHaveLength(3);
    expect(result.current.rows[0]).toMatchObject({
      originType: 'forteCircuit',
      damage: 690,
    });
    expect(result.current.rows[0]?.pctOfCharacter).toBeCloseTo(76.67, 2);
    expect(result.current.rows[1]).toMatchObject({
      originType: 'resonanceLiberation',
      damage: 159,
    });
    expect(result.current.rows[2]).toMatchObject({
      originType: 'other',
      damage: 51,
    });
    expect(result.current.chartData.map((row) => row.label)).toEqual([
      'Forte Circuit',
      'Resonance Liberation',
      'Other',
    ]);
  });
});
