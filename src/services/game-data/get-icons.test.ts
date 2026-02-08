/* eslint-disable unicorn/no-null */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { database } from '@/db/client';
import type { Attack, Entity, Modifier } from '@/db/schema';
import { AbilityAttribute, Attribute } from '@/types';

import { getIconsHandler } from './get-icons.server';

// Mock the database
vi.mock('@/db/client', () => ({
  database: {
    query: {
      attacks: {
        findMany: vi.fn(),
      },
      modifiers: {
        findMany: vi.fn(),
      },
      entities: {
        findMany: vi.fn(),
      },
    },
  },
}));

// Factory functions for creating test data
const createAttack = (overrides: Partial<Attack> = {}): Attack => ({
  id: 1,
  entityId: 100,
  name: 'Test Attack',
  parentName: null,
  description: 'Test attack description',
  iconPath: null,
  unlockedAt: null,
  echoSetBonusRequirement: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  scalingStat: AbilityAttribute.ATK,
  attribute: null,
  motionValues: [1],
  tags: [],
  alternativeDefinitions: null,
  originType: null,
  ...overrides,
});

const createModifier = (overrides: Partial<Modifier> = {}): Modifier => ({
  id: 1,
  entityId: 100,
  name: 'Test Modifier',
  parentName: null,
  description: 'Test modifier description',
  iconPath: null,
  unlockedAt: null,
  echoSetBonusRequirement: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  target: 'self',
  modifiedStats: [],
  alternativeDefinitions: null,
  originType: null,
  ...overrides,
});

const createEntity = (overrides: Partial<Entity> = {}): Entity => ({
  id: 100,
  hakushinId: 1102,
  name: 'Test Entity',
  type: 'character',
  iconPath: null,
  attribute: Attribute.GLACIO,
  echoSetIds: null,
  setBonusThresholds: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('getIconsHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('capability icon fallback to entity icon', () => {
    it('uses capability icon when available', async () => {
      // Setup: Attack with its own icon
      vi.mocked(database.query.attacks.findMany).mockResolvedValue([
        createAttack({
          id: 1,
          iconPath: '/Game/Aki/UI/UIResources/Common/Atlas/SkillIcon/T_Attack1.png',
          entityId: 100,
        }),
      ]);

      vi.mocked(database.query.modifiers.findMany).mockResolvedValue([]);
      vi.mocked(database.query.entities.findMany).mockResolvedValue([]);

      const result = await getIconsHandler([{ id: 1, type: 'attack' }]);

      expect(result).toHaveLength(1);
      expect(result[0].iconUrl).toBe(
        'https://api.hakush.in/ww/UI/UIResources/Common/Atlas/SkillIcon/T_Attack1.webp',
      );
      // Should not query entities for fallback since attack has its own icon
      expect(database.query.entities.findMany).toHaveBeenCalledTimes(0);
    });

    it('falls back to entity icon when capability has no icon', async () => {
      // Setup: Attack without icon, entity with icon
      vi.mocked(database.query.attacks.findMany).mockResolvedValue([
        createAttack({
          id: 1,
          iconPath: null,
          entityId: 100,
        }),
      ]);

      vi.mocked(database.query.modifiers.findMany).mockResolvedValue([]);

      // First call for entity fallback lookup
      vi.mocked(database.query.entities.findMany).mockResolvedValueOnce([
        createEntity({
          id: 100,
          iconPath:
            '/Game/Aki/UI/UIResources/Common/Image/IconRoleHead256/T_Character.png',
        }),
      ]);

      const result = await getIconsHandler([{ id: 1, type: 'attack' }]);

      expect(result).toHaveLength(1);
      expect(result[0].iconUrl).toBe(
        'https://api.hakush.in/ww/UI/UIResources/Common/Image/IconRoleHead256/T_Character.webp',
      );
      // Should query entities for fallback
      expect(database.query.entities.findMany).toHaveBeenCalledTimes(1);
    });

    it('handles multiple capabilities with mixed icon availability', async () => {
      // Setup: One attack with icon, one without
      vi.mocked(database.query.attacks.findMany).mockResolvedValue([
        createAttack({
          id: 1,
          iconPath: '/Game/Aki/UI/UIResources/Common/Atlas/SkillIcon/T_Attack1.png',
          entityId: 100,
        }),
        createAttack({
          id: 2,
          iconPath: null,
          entityId: 101,
        }),
      ]);

      vi.mocked(database.query.modifiers.findMany).mockResolvedValue([]);

      // Entity fallback for attack 2
      vi.mocked(database.query.entities.findMany).mockResolvedValueOnce([
        createEntity({
          id: 101,
          iconPath:
            '/Game/Aki/UI/UIResources/Common/Image/IconRoleHead256/T_Character2.png',
        }),
      ]);

      const result = await getIconsHandler([
        { id: 1, type: 'attack' },
        { id: 2, type: 'attack' },
      ]);

      expect(result).toHaveLength(2);
      // Attack 1 uses its own icon
      expect(result[0].iconUrl).toBe(
        'https://api.hakush.in/ww/UI/UIResources/Common/Atlas/SkillIcon/T_Attack1.webp',
      );
      // Attack 2 falls back to entity icon
      expect(result[1].iconUrl).toBe(
        'https://api.hakush.in/ww/UI/UIResources/Common/Image/IconRoleHead256/T_Character2.webp',
      );
    });

    it('returns undefined when neither capability nor entity has icon', async () => {
      // Setup: Attack without icon, entity also without icon
      vi.mocked(database.query.attacks.findMany).mockResolvedValue([
        createAttack({
          id: 1,
          iconPath: null,
          entityId: 100,
        }),
      ]);

      vi.mocked(database.query.modifiers.findMany).mockResolvedValue([]);

      vi.mocked(database.query.entities.findMany).mockResolvedValueOnce([
        createEntity({
          id: 100,
          iconPath: null,
        }),
      ]);

      const result = await getIconsHandler([{ id: 1, type: 'attack' }]);

      expect(result).toHaveLength(1);
      expect(result[0].iconUrl).toBeUndefined();
    });

    it('works for modifiers with fallback', async () => {
      // Setup: Modifier without icon
      vi.mocked(database.query.attacks.findMany).mockResolvedValue([]);

      vi.mocked(database.query.modifiers.findMany).mockResolvedValue([
        createModifier({
          id: 5,
          iconPath: null,
          entityId: 200,
        }),
      ]);

      vi.mocked(database.query.entities.findMany).mockResolvedValueOnce([
        createEntity({
          id: 200,
          iconPath: '/Game/Aki/UI/UIResources/Common/Image/IconWeapon/T_Weapon.png',
        }),
      ]);

      const result = await getIconsHandler([{ id: 5, type: 'modifier' }]);

      expect(result).toHaveLength(1);
      expect(result[0].iconUrl).toBe(
        'https://api.hakush.in/ww/UI/UIResources/Common/Image/IconWeapon/T_Weapon.webp',
      );
    });
  });

  describe('entity icons', () => {
    it('fetches entity icon by hakushinId', async () => {
      vi.mocked(database.query.attacks.findMany).mockResolvedValue([]);
      vi.mocked(database.query.modifiers.findMany).mockResolvedValue([]);

      vi.mocked(database.query.entities.findMany).mockResolvedValue([
        createEntity({
          hakushinId: 1102,
          iconPath:
            '/Game/Aki/UI/UIResources/Common/Image/IconRoleHead256/T_IconRoleHead256_7_UI.png',
        }),
      ]);

      const result = await getIconsHandler([{ id: 1102, type: 'entity' }]);

      expect(result).toHaveLength(1);
      expect(result[0].iconUrl).toBe(
        'https://api.hakush.in/ww/UI/UIResources/Common/Image/IconRoleHead256/T_IconRoleHead256_7_UI.webp',
      );
    });
  });
});
