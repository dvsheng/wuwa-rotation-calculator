import {
  ECHO_SUBSTAT_VALUES,
  EchoMainStatOption,
  EchoSubstatOption,
} from '@/schemas/echo';
import type { EchoCost, EchoMainStatOptionType } from '@/schemas/echo';
import type { Enemy as ClientEnemy } from '@/schemas/enemy';
import type { AttackInstance, ModifierInstance } from '@/schemas/rotation';
import { getEchoStats } from '@/services/game-data';
import type { CharacterDerivedAttributes, CharacterEntity } from '@/services/game-data';
import { getEntityById } from '@/services/game-data/get-entity-details.function';
import type { CharacterStat } from '@/types';

import { calculateClientRotationResult } from './calculate-client-rotation-damage';
import type {
  InjectedCharacterStat,
  RotationCalculationTeam,
} from './calculate-client-rotation-damage';
import {
  ECHO_STAT_MAP,
  normalizeEchoSubstatValue,
} from './client-input-adapter/adapt-client-input-to-rotation';
import { SensitivityAnalysisCategory } from './client-output-adapter/adapt-rotation-result-to-client-output';
import type {
  ClientSensitivityAnalysis,
  ClientSensitivityAnalysisScenario,
} from './client-output-adapter/adapt-rotation-result-to-client-output';

interface CalculateRotationSensitivityProperties {
  clientTeam: RotationCalculationTeam;
  clientEnemy: ClientEnemy;
  attacks: Array<AttackInstance>;
  buffs: Array<ModifierInstance>;
  baselineTotalDamage: number;
  characterIndex?: number;
}

const formatOptionLabel = (value: string) => {
  return value
    .split('_')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
};

const createScenario = (
  scenario: Omit<
    ClientSensitivityAnalysisScenario,
    'totalDamageDelta' | 'relativeDelta'
  >,
  baselineTotalDamage: number,
): ClientSensitivityAnalysisScenario => {
  const totalDamageDelta = scenario.perturbedTotalDamage - baselineTotalDamage;

  return {
    ...scenario,
    totalDamageDelta,
    relativeDelta:
      baselineTotalDamage === 0 ? 0 : totalDamageDelta / baselineTotalDamage,
  };
};

const withAdditionalStats = (
  clientTeam: RotationCalculationTeam,
  characterIndex: number,
  additionalStats: Array<InjectedCharacterStat>,
): RotationCalculationTeam => {
  return clientTeam.map((character, index) => ({
    ...character,
    additionalStats:
      index === characterIndex
        ? [...(character.additionalStats ?? []), ...additionalStats]
        : [...(character.additionalStats ?? [])],
  }));
};

const calculatePerturbedTotalDamage = async (
  clientTeam: RotationCalculationTeam,
  clientEnemy: ClientEnemy,
  attacks: Array<AttackInstance>,
  buffs: Array<ModifierInstance>,
  characterIndex: number,
  additionalStats: Array<InjectedCharacterStat>,
) => {
  const result = await calculateClientRotationResult(
    withAdditionalStats(clientTeam, characterIndex, additionalStats),
    clientEnemy,
    attacks,
    buffs,
  );

  return result.totalDamage;
};

const createInjectedStat = (
  stat: CharacterStat,
  value: number,
  tags: Array<string>,
  description: string,
): InjectedCharacterStat => ({
  stat,
  value,
  tags,
  name: 'Sensitivity Analysis',
  description,
});

const createMainStatDelta = (
  cost: EchoCost,
  currentMainStat: EchoMainStatOptionType,
  targetMainStat: EchoMainStatOptionType,
): Array<InjectedCharacterStat> => {
  const currentStats = getEchoStats(cost, currentMainStat);
  const targetStats = getEchoStats(cost, targetMainStat);

  if (!currentStats.primary || !targetStats.primary) {
    return [];
  }

  const deltas = new Map<string, InjectedCharacterStat>();
  const description = `${cost}-cost ${currentMainStat} -> ${targetMainStat}`;

  const applyDelta = (
    stat: { stat: CharacterStat; value: number; tags: Array<string> },
    multiplier: 1 | -1,
  ) => {
    const key = `${stat.stat}:${stat.tags.join('|')}`;
    const existing = deltas.get(key);
    const nextValue = (existing?.value ?? 0) + stat.value * multiplier;

    if (nextValue === 0) {
      deltas.delete(key);
      return;
    }

    deltas.set(key, createInjectedStat(stat.stat, nextValue, stat.tags, description));
  };

  for (const stat of [currentStats.primary, currentStats.secondary]) {
    applyDelta(stat as { stat: CharacterStat; value: number; tags: Array<string> }, -1);
  }

  for (const stat of [targetStats.primary, targetStats.secondary]) {
    applyDelta(stat as { stat: CharacterStat; value: number; tags: Array<string> }, 1);
  }

  return [...deltas.values()];
};

const createMainStatDeltaKey = (additionalStats: Array<InjectedCharacterStat>) => {
  return additionalStats
    .map((stat) => `${stat.stat}:${stat.tags.join('|')}:${stat.value}`)
    .toSorted()
    .join(';');
};

const buildSubstatScenarios = async ({
  clientTeam,
  clientEnemy,
  attacks,
  buffs,
  baselineTotalDamage,
  characterIndex,
}: Omit<CalculateRotationSensitivityProperties, 'characterIndex'> & {
  characterIndex: number;
}): Promise<Array<ClientSensitivityAnalysisScenario>> => {
  return Promise.all(
    Object.values(EchoSubstatOption).map(async (substatOption) => {
      const [stat, tags] = ECHO_STAT_MAP[substatOption];
      const rollValue = ECHO_SUBSTAT_VALUES[substatOption][2];
      const additionalStats = [
        createInjectedStat(
          stat,
          normalizeEchoSubstatValue(substatOption, rollValue),
          tags,
          `Extra ${substatOption} roll`,
        ),
      ];

      return createScenario(
        {
          id: `substat:${substatOption}`,
          category: SensitivityAnalysisCategory.SUBSTAT_ROLL,
          label: `+1 ${formatOptionLabel(substatOption)} roll`,
          description: `Adds one extra ${rollValue} ${formatOptionLabel(
            substatOption,
          )} substat roll to character ${characterIndex + 1}.`,
          perturbedTotalDamage: await calculatePerturbedTotalDamage(
            clientTeam,
            clientEnemy,
            attacks,
            buffs,
            characterIndex,
            additionalStats,
          ),
        },
        baselineTotalDamage,
      );
    }),
  );
};

const buildThreeCostMainStatScenarios = async ({
  clientTeam,
  clientEnemy,
  attacks,
  buffs,
  baselineTotalDamage,
  characterIndex,
  derivedAttributes,
}: Omit<CalculateRotationSensitivityProperties, 'characterIndex'> & {
  characterIndex: number;
  derivedAttributes: CharacterDerivedAttributes;
}): Promise<Array<ClientSensitivityAnalysisScenario>> => {
  const character = clientTeam[characterIndex];
  const { preferredThreeCostAttributeMainStat, preferredThreeCostScalingMainStat } =
    derivedAttributes;

  if (!preferredThreeCostAttributeMainStat) {
    return [];
  }

  const dedupedScenarios = new Map<
    string,
    {
      echoIndex: number;
      currentMainStat: EchoMainStatOptionType;
      candidateMainStat: EchoMainStatOptionType;
      additionalStats: Array<InjectedCharacterStat>;
    }
  >();

  for (const [echoIndex, echo] of character.echoStats.entries()) {
    if (echo.cost !== 3) continue;

    const candidateMainStats = [
      preferredThreeCostAttributeMainStat,
      preferredThreeCostScalingMainStat,
    ].filter((mainStat, index, array) => array.indexOf(mainStat) === index);

    for (const candidateMainStat of candidateMainStats) {
      if (echo.mainStatType === candidateMainStat) continue;

      const additionalStats = createMainStatDelta(
        echo.cost,
        echo.mainStatType,
        candidateMainStat,
      );
      const dedupeKey = createMainStatDeltaKey(additionalStats);

      if (dedupedScenarios.has(dedupeKey)) {
        continue;
      }

      dedupedScenarios.set(dedupeKey, {
        echoIndex,
        currentMainStat: echo.mainStatType,
        candidateMainStat,
        additionalStats,
      });
    }
  }

  return Promise.all(
    [...dedupedScenarios.values()].map(
      async ({ echoIndex, currentMainStat, candidateMainStat, additionalStats }) => {
        return createScenario(
          {
            id: `three-cost:${echoIndex}:${candidateMainStat}`,
            category: SensitivityAnalysisCategory.THREE_COST_MAIN_STAT_SWAP,
            label: `3-cost: ${formatOptionLabel(currentMainStat)} -> ${formatOptionLabel(
              candidateMainStat,
            )}`,
            description: `Changes one 3-cost echo main stat on character ${
              characterIndex + 1
            } from ${formatOptionLabel(currentMainStat)} to ${formatOptionLabel(
              candidateMainStat,
            )}.`,
            perturbedTotalDamage: await calculatePerturbedTotalDamage(
              clientTeam,
              clientEnemy,
              attacks,
              buffs,
              characterIndex,
              additionalStats,
            ),
          },
          baselineTotalDamage,
        );
      },
    ),
  );
};

const buildFourCostMainStatScenarios = async ({
  clientTeam,
  clientEnemy,
  attacks,
  buffs,
  baselineTotalDamage,
  characterIndex,
}: Omit<CalculateRotationSensitivityProperties, 'characterIndex'> & {
  characterIndex: number;
}): Promise<Array<ClientSensitivityAnalysisScenario>> => {
  const echoIndex = clientTeam[characterIndex].echoStats.findIndex(
    (echo) => echo.cost === 4,
  );
  if (echoIndex === -1) {
    return [];
  }

  const currentMainStat = clientTeam[characterIndex].echoStats[echoIndex].mainStatType;
  const targetMainStat =
    currentMainStat === EchoMainStatOption.CRIT_RATE
      ? EchoMainStatOption.CRIT_DMG
      : currentMainStat === EchoMainStatOption.CRIT_DMG
        ? EchoMainStatOption.CRIT_RATE
        : undefined;

  if (!targetMainStat) {
    return [];
  }

  const additionalStats = createMainStatDelta(4, currentMainStat, targetMainStat);

  return [
    createScenario(
      {
        id: `four-cost:${echoIndex}:${targetMainStat}`,
        category: SensitivityAnalysisCategory.FOUR_COST_MAIN_STAT_SWAP,
        label: `4-cost: ${formatOptionLabel(currentMainStat)} -> ${formatOptionLabel(
          targetMainStat,
        )}`,
        description: `Changes the first 4-cost echo main stat on character ${
          characterIndex + 1
        } from ${formatOptionLabel(currentMainStat)} to ${formatOptionLabel(
          targetMainStat,
        )}.`,
        perturbedTotalDamage: await calculatePerturbedTotalDamage(
          clientTeam,
          clientEnemy,
          attacks,
          buffs,
          characterIndex,
          additionalStats,
        ),
      },
      baselineTotalDamage,
    ),
  ];
};

export const calculateRotationSensitivityAnalysis = async ({
  clientTeam,
  clientEnemy,
  attacks,
  buffs,
  baselineTotalDamage,
  characterIndex = 0,
}: CalculateRotationSensitivityProperties): Promise<ClientSensitivityAnalysis> => {
  const characterDetails = (await getEntityById({
    data: {
      id: clientTeam[characterIndex].id,
      entityType: 'character',
      activatedSequence: clientTeam[characterIndex].sequence,
    },
  })) as CharacterEntity;

  const [substatScenarios, threeCostScenarios, fourCostScenarios] = await Promise.all([
    buildSubstatScenarios({
      clientTeam,
      clientEnemy,
      attacks,
      buffs,
      baselineTotalDamage,
      characterIndex,
    }),
    buildThreeCostMainStatScenarios({
      clientTeam,
      clientEnemy,
      attacks,
      buffs,
      baselineTotalDamage,
      characterIndex,
      derivedAttributes: characterDetails.derivedAttributes,
    }),
    buildFourCostMainStatScenarios({
      clientTeam,
      clientEnemy,
      attacks,
      buffs,
      baselineTotalDamage,
      characterIndex,
    }),
  ]);

  return {
    baselineTotalDamage,
    characterIndex,
    scenarios: [...substatScenarios, ...threeCostScenarios, ...fourCostScenarios],
  };
};
