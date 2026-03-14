import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DatabaseFullCapability } from '@/db/schema';
import { EchoMainStatOption } from '@/schemas/echo';

import { CapabilityType, OriginType } from './types';

// Mock the database and schema modules before importing the module under test.
vi.mock('@/db/client', () => ({
  database: {
    select: vi.fn(),
  },
}));
vi.mock('@/db/schema', () => ({
  fullCapabilities: { entityId: 'entity_id' },
}));
vi.mock('drizzle-orm', async (importOriginal) => {
  const original = (await importOriginal()) as any;
  return { ...original, eq: vi.fn() };
});

const { database } = await import('@/db/client');
const { getEntityByIdHandler } = await import('./get-entity-details.server');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeMockAttackRow = (overrides: Partial<DatabaseFullCapability> = {}) => ({
  capabilityId: 1,
  capabilityType: CapabilityType.ATTACK,
  capabilityName: 'Blazing Slash',
  capabilityDescription: undefined,
  skillId: 10,
  skillName: 'Normal Attack',
  skillDescription: undefined,
  skillOriginType: OriginType.NORMAL_ATTACK,
  skillIconUrl: undefined,
  entityId: 100,
  entityName: 'Test Character',
  entityType: 'character',
  entityIconUrl: undefined,
  entityDescription: undefined,
  rank: 5,
  weaponType: 'sword',
  attribute: 'fusion',
  echoSetIds: undefined,
  cost: undefined,
  setBonusThresholds: undefined,
  capabilityJson: {
    type: 'attack',
    damageInstances: [
      {
        attribute: 'fusion',
        damageType: 'basicAttack',
        tags: ['aerial'],
        motionValue: 1.5,
        scalingStat: 'atk',
      },
    ],
  },
  ...overrides,
});

const mockDatabaseSelect = (rows: Array<unknown>) => {
  const where = vi.fn().mockResolvedValue(rows);
  const from = vi.fn().mockReturnValue({ where });
  vi.mocked(database.select).mockReturnValue({ from } as any);
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getEntityByIdHandler — attack damage instance fields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('preserves attribute and damageType as dedicated typed fields', async () => {
    mockDatabaseSelect([makeMockAttackRow({ entityId: 100 })]);

    const entity = await getEntityByIdHandler({
      id: 100,
      entityType: 'character',
      activatedSequence: 0,
    });

    const [instance] = entity.capabilities.attacks[0].damageInstances;
    expect(instance.attribute).toBe('fusion');
    expect(instance.damageType).toBe('basicAttack');
  });

  it('injects attribute and damageType into the tags array for the calculation engine', async () => {
    mockDatabaseSelect([makeMockAttackRow({ entityId: 101 })]);

    const entity = await getEntityByIdHandler({
      id: 101,
      entityType: 'character',
      activatedSequence: 0,
    });

    const { tags } = entity.capabilities.attacks[0].damageInstances[0];
    expect(tags).toContain('fusion');
    expect(tags).toContain('basicAttack');
  });

  it('preserves existing tags and appends the capability name', async () => {
    mockDatabaseSelect([makeMockAttackRow({ entityId: 102 })]);

    const entity = await getEntityByIdHandler({
      id: 102,
      entityType: 'character',
      activatedSequence: 0,
    });

    const { tags } = entity.capabilities.attacks[0].damageInstances[0];
    expect(tags).toContain('aerial');
    expect(tags).toContain('Blazing Slash');
  });

  it('handles multiple damage instances with different attributes and damage types', async () => {
    mockDatabaseSelect([
      makeMockAttackRow({
        entityId: 103,
        capabilityJson: {
          type: 'attack',
          damageInstances: [
            {
              attribute: 'glacio',
              damageType: 'heavyAttack',
              tags: [],
              motionValue: 2,
              scalingStat: 'atk',
            },
            {
              attribute: 'fusion',
              damageType: 'resonanceSkill',
              tags: ['coordinatedAttack'],
              motionValue: 1,
              scalingStat: 'hp',
            },
          ],
        },
      }),
    ]);

    const entity = await getEntityByIdHandler({
      id: 103,
      entityType: 'character',
      activatedSequence: 0,
    });

    const [first, second] = entity.capabilities.attacks[0].damageInstances;
    expect(first.attribute).toBe('glacio');
    expect(first.damageType).toBe('heavyAttack');
    expect(first.tags).toContain('glacio');
    expect(first.tags).toContain('heavyAttack');

    expect(second.attribute).toBe('fusion');
    expect(second.damageType).toBe('resonanceSkill');
    expect(second.tags).toContain('fusion');
    expect(second.tags).toContain('resonanceSkill');
    expect(second.tags).toContain('coordinatedAttack');
  });
});

describe('getEntityByIdHandler — caching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('memoizes repeated identical requests', async () => {
    mockDatabaseSelect([makeMockAttackRow({ entityId: 107 })]);

    const first = await getEntityByIdHandler({
      id: 107,
      entityType: 'character',
      activatedSequence: 0,
    });
    const second = await getEntityByIdHandler({
      id: 107,
      entityType: 'character',
      activatedSequence: 0,
    });

    expect(first).toEqual(second);
    expect(database.select).toHaveBeenCalledTimes(1);
  });
});

describe('getEntityByIdHandler — character derivedAttributes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('includes derivedAttributes for character entities', async () => {
    mockDatabaseSelect([
      makeMockAttackRow({
        entityId: 104,
        capabilityJson: {
          type: 'attack',
          damageInstances: [
            {
              attribute: 'fusion',
              damageType: 'basicAttack',
              tags: [],
              motionValue: 1,
              scalingStat: 'atk',
            },
            {
              attribute: 'fusion',
              damageType: 'resonanceSkill',
              tags: [],
              motionValue: 1,
              scalingStat: 'atk',
            },
          ],
        },
      }),
    ]);

    const entity = await getEntityByIdHandler({
      id: 104,
      entityType: 'character',
      activatedSequence: 0,
    });

    expect(entity).toHaveProperty('derivedAttributes');
    expect((entity as any).derivedAttributes).toEqual({
      preferredScalingStat: 'atk',
      dominantAttribute: 'fusion',
      preferredThreeCostScalingMainStat: EchoMainStatOption.ATK_PERCENT,
      preferredThreeCostAttributeMainStat: EchoMainStatOption.DAMAGE_BONUS_FUSION,
    });
  });

  it('prioritizes hp/def scaling over atk when deriving scaling main stats', async () => {
    mockDatabaseSelect([
      makeMockAttackRow({
        entityId: 105,
        capabilityJson: {
          type: 'attack',
          damageInstances: [
            {
              attribute: 'spectro',
              damageType: 'resonanceLiberation',
              tags: [],
              motionValue: 1,
              scalingStat: 'hp',
            },
            {
              attribute: 'spectro',
              damageType: 'basicAttack',
              tags: [],
              motionValue: 1,
              scalingStat: 'atk',
            },
          ],
        },
      }),
    ]);

    const entity = await getEntityByIdHandler({
      id: 105,
      entityType: 'character',
      activatedSequence: 0,
    });

    expect((entity as any).derivedAttributes.preferredScalingStat).toBe('hp');
    expect((entity as any).derivedAttributes.preferredThreeCostScalingMainStat).toBe(
      EchoMainStatOption.HP_PERCENT,
    );
    expect((entity as any).derivedAttributes.preferredThreeCostAttributeMainStat).toBe(
      EchoMainStatOption.DAMAGE_BONUS_SPECTRO,
    );
  });

  it('does not include derivedAttributes for non-character entities', async () => {
    mockDatabaseSelect([
      makeMockAttackRow({
        entityId: 106,
        entityType: 'weapon',
      }),
    ]);

    const entity = await getEntityByIdHandler({
      id: 106,
      entityType: 'weapon',
      refineLevel: '1',
    });

    expect(entity).not.toHaveProperty('derivedAttributes');
  });
});
