import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DatabaseFullCapability } from '@/db/schema';

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
    mockDatabaseSelect([makeMockAttackRow()]);

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
    mockDatabaseSelect([makeMockAttackRow()]);

    const entity = await getEntityByIdHandler({
      id: 100,
      entityType: 'character',
      activatedSequence: 0,
    });

    const { tags } = entity.capabilities.attacks[0].damageInstances[0];
    expect(tags).toContain('fusion');
    expect(tags).toContain('basicAttack');
  });

  it('preserves existing tags and appends the capability name', async () => {
    mockDatabaseSelect([makeMockAttackRow()]);

    const entity = await getEntityByIdHandler({
      id: 100,
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
      id: 100,
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
