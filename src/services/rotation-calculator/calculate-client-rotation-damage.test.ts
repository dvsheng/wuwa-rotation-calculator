import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Enemy } from '@/schemas/enemy';
import type { AttackInstance, ModifierInstance } from '@/schemas/rotation';
import type { Team } from '@/schemas/team';
import { CapabilityType, OriginType } from '@/services/game-data';
import {
  AttackScalingProperty,
  Attribute,
  CharacterStat,
  DamageType,
  Tag,
} from '@/types';

import { calculateRotationHandler } from './calculate-client-rotation-damage';
import * as sensitivityAnalysis from './calculate-rotation-sensitivity';
import * as enrichRotationData from './client-input-adapter/enrich-rotation-data';

const createTestTeam = (): Team => [
  {
    id: 1306,
    sequence: 0,
    weapon: { id: 21_040_016, refine: '1' },
    echoSets: [],
    primarySlotEcho: { id: 6_000_038 },
    echoStats: [],
  },
  {
    id: 1405,
    sequence: 0,
    weapon: { id: 21_050_016, refine: '1' },
    echoSets: [],
    primarySlotEcho: { id: 6_000_041 },
    echoStats: [],
  },
  {
    id: 1102,
    sequence: 0,
    weapon: { id: 21_010_026, refine: '1' },
    echoSets: [],
    primarySlotEcho: { id: 6_000_037 },
    echoStats: [],
  },
];

const createTestEnemy = (): Enemy => ({
  level: 100,
  resistances: {
    [Attribute.GLACIO]: 10,
    [Attribute.FUSION]: 10,
    [Attribute.AERO]: 10,
    [Attribute.ELECTRO]: 10,
    [Attribute.HAVOC]: 10,
    [Attribute.SPECTRO]: 10,
    [Attribute.PHYSICAL]: 10,
  },
});

const createAttack = (): AttackInstance => ({
  id: 101,
  characterId: 1306,
  instanceId: 'attack-1',
  parameterValues: [],
});

const createBuff = (x: number): ModifierInstance => ({
  id: 201,
  characterId: 1306,
  instanceId: `buff-${x}`,
  x,
  y: 0,
  w: 1,
  h: 1,
  parameterValues: [],
});

const createGameDataEnricherMock = () => ({
  enrichAttack: (attack: AttackInstance) =>
    ({
      ...attack,
      name: 'Basic Attack Stage 1',
      description: 'Electro basic attack',
      parentName: 'Basic Attack',
      originType: OriginType.NORMAL_ATTACK,
      skillId: 1,
      entityId: 1306,
      capabilityJson: {
        type: CapabilityType.ATTACK,
        damageInstances: [
          {
            motionValue: 1,
            tags: [Tag.BASIC_ATTACK, Tag.ELECTRO],
            damageType: DamageType.BASIC_ATTACK,
            attribute: Attribute.ELECTRO,
            scalingStat: AttackScalingProperty.ATK,
          },
        ],
      },
    }) as any,
  enrichModifier: (modifier: ModifierInstance) =>
    ({
      ...modifier,
      name: 'Electro Damage Buff',
      description: 'Buff description',
      parentName: 'Inherent Skill',
      originType: OriginType.INHERENT_SKILL,
      skillId: 2,
      entityId: 1306,
      capabilityJson: {
        type: CapabilityType.MODIFIER,
        modifiedStats: [
          {
            target: 'self',
            stat: CharacterStat.DAMAGE_BONUS,
            value: 1,
            tags: [Tag.ELECTRO],
          },
        ],
      },
    }) as any,
  getPermanentStatsForCharacter: (charIndex: number) =>
    charIndex === 0
      ? ([
          {
            id: 301,
            name: 'Base ATK',
            description: 'Base stat description',
            parentName: 'Base Stats',
            originType: OriginType.BASE_STATS,
            skillId: 3,
            entityId: 1306,
            capabilityJson: {
              type: CapabilityType.PERMANENT_STAT,
              stat: CharacterStat.ATTACK_FLAT,
              value: 100,
              tags: [Tag.ALL],
            },
          },
        ] as any)
      : [],
});

const createSensitivityAnalysis = () =>
  ({
    baselineTotalDamage: 0,
    characterIndex: 0,
    scenarios: [],
  }) as any;

describe('calculateRotationHandler', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('applies a modifier only when the attack is inside its range', async () => {
    vi.spyOn(enrichRotationData, 'createGameDataEnricher').mockResolvedValue(
      createGameDataEnricherMock() as any,
    );
    vi.spyOn(
      sensitivityAnalysis,
      'calculateRotationSensitivityAnalysis',
    ).mockResolvedValue(createSensitivityAnalysis());

    const team = createTestTeam();
    const enemy = createTestEnemy();
    const attacks = [createAttack()];

    const withoutBuff = await calculateRotationHandler(team, enemy, attacks, [
      createBuff(1),
    ]);
    const withBuff = await calculateRotationHandler(team, enemy, attacks, [
      createBuff(0),
    ]);

    expect(withBuff.totalDamage).toBeGreaterThan(withoutBuff.totalDamage);
  });

  it('preserves permanent stat source metadata in teamDetails', async () => {
    vi.spyOn(enrichRotationData, 'createGameDataEnricher').mockResolvedValue(
      createGameDataEnricherMock() as any,
    );
    vi.spyOn(
      sensitivityAnalysis,
      'calculateRotationSensitivityAnalysis',
    ).mockResolvedValue(createSensitivityAnalysis());

    const result = await calculateRotationHandler(
      createTestTeam(),
      createTestEnemy(),
      [createAttack()],
      [],
    );

    const attackFlatStats = result.damageDetails[0]?.teamDetails[0]?.attackFlat ?? [];
    const baseAtk = attackFlatStats.find((entry) => entry.name === 'Base ATK');

    expect(baseAtk?.description).toBe('Base stat description');
  });

  it('preserves enemy base resistance metadata in enemyDetails', async () => {
    vi.spyOn(enrichRotationData, 'createGameDataEnricher').mockResolvedValue(
      createGameDataEnricherMock() as any,
    );
    vi.spyOn(
      sensitivityAnalysis,
      'calculateRotationSensitivityAnalysis',
    ).mockResolvedValue(createSensitivityAnalysis());

    const result = await calculateRotationHandler(
      createTestTeam(),
      createTestEnemy(),
      [createAttack()],
      [],
    );

    const electroResistance = result.damageDetails[0]?.enemyDetails.baseResistance.find(
      (entry) => entry.tags.includes(Attribute.ELECTRO),
    );

    expect(electroResistance?.name).toBe(Attribute.ELECTRO);
    expect(electroResistance?.description).toBe('Base Resistance');
  });

  it('returns the sensitivity analysis produced by the sensitivity service', async () => {
    const mockedSensitivityResult = [{ category: 'substat', deltas: [] }] as any;

    vi.spyOn(enrichRotationData, 'createGameDataEnricher').mockResolvedValue(
      createGameDataEnricherMock() as any,
    );
    vi.spyOn(
      sensitivityAnalysis,
      'calculateRotationSensitivityAnalysis',
    ).mockResolvedValue(mockedSensitivityResult);

    const result = await calculateRotationHandler(
      createTestTeam(),
      createTestEnemy(),
      [createAttack()],
      [],
    );

    expect(result.sensitivityAnalysis).toBe(mockedSensitivityResult);
  });
});
