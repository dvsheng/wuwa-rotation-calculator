import { describe, expect, it } from 'vitest';

import { CharacterStat } from '@/types/character';
import { EnemyStat } from '@/types/enemy';

import { OperationType, resolveStats } from './resolve-runtime-number';

// ─── Test helpers ────────────────────────────────────────────────────────────

type AnyNode = number | Record<string, any>;

/** Returns a character stat record with every stat defaulting to [0]. */
function makeCharStats(
  overrides: Partial<Record<CharacterStat, Array<AnyNode>>> = {},
): Record<CharacterStat, Array<AnyNode>> {
  return Object.fromEntries(
    Object.values(CharacterStat).map((s) => [s, overrides[s] ?? [0]]),
  ) as Record<CharacterStat, Array<AnyNode>>;
}

/** Returns an enemy stat record with every stat defaulting to [0]. */
function makeEnemyStats(
  overrides: Partial<Record<EnemyStat, Array<AnyNode>>> = {},
): Record<EnemyStat, Array<AnyNode>> {
  return Object.fromEntries(
    Object.values(EnemyStat).map((s) => [s, overrides[s] ?? [0]]),
  ) as Record<EnemyStat, Array<AnyNode>>;
}

// Node constructors — mirrors the internal NumberNode shapes without importing
// the private types.

const sum = (...operands: Array<AnyNode>) => ({ type: OperationType.SUM, operands });
const product = (...operands: Array<AnyNode>) => ({
  type: OperationType.PRODUCT,
  operands,
});
const clamp = (operand: AnyNode, minimum: number, maximum: number) => ({
  type: OperationType.CLAMP,
  operand,
  minimum,
  maximum,
});
const conditional = (
  operand: AnyNode,
  operator: '>' | '>=' | '<' | '<=',
  threshold: number,
  valueIfTrue: AnyNode,
  valueIfFalse: AnyNode,
  reverseThreshold?: number,
) => ({
  type: OperationType.CONDITIONAL,
  operand,
  operator,
  threshold,
  ...(reverseThreshold === undefined ? {} : { reverseThreshold }),
  valueIfTrue,
  valueIfFalse,
});

/** Reference to an enemy stat (no characterIndex → resolved against enemy context). */
const enemyReference = (stat: EnemyStat) => ({ type: 'statParameterizedNumber', stat });

/** Reference to a specific team member's stat. */
const teamReference = (characterIndex: number, stat: CharacterStat) => ({
  type: 'statParameterizedNumber',
  stat,
  characterIndex,
});

// Convenience: call resolveStats with our loosely-typed helpers

const resolve = (
  team: Array<Record<CharacterStat, Array<AnyNode>>>,
  enemy: Record<EnemyStat, Array<AnyNode>>,
) => resolveStats(team as any, enemy as any);

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('resolveStats', () => {
  // ── Primitive values ────────────────────────────────────────────────────

  describe('plain numbers', () => {
    it('resolves a single number as-is', () => {
      const team = [makeCharStats({ [CharacterStat.ATTACK_FLAT]: [1500] })];
      const enemy = makeEnemyStats({ [EnemyStat.BASE_RESISTANCE]: [0.1] });

      const result = resolve(team, enemy);

      expect(result.team[0][CharacterStat.ATTACK_FLAT]).toBe(1500);
      expect(result.enemy[EnemyStat.BASE_RESISTANCE]).toBe(0.1);
    });

    it('sums multiple plain numbers in the same stat array', () => {
      const team = [makeCharStats({ [CharacterStat.ATTACK_FLAT]: [1000, 300, 200] })];
      const enemy = makeEnemyStats();

      const result = resolve(team, enemy);

      expect(result.team[0][CharacterStat.ATTACK_FLAT]).toBe(1500);
    });
  });

  // ── Arithmetic operations ───────────────────────────────────────────────

  describe('SUM operation', () => {
    it('adds all operands', () => {
      const team = [makeCharStats({ [CharacterStat.DAMAGE_BONUS]: [sum(1, 2, 3)] })];

      const result = resolve(team, makeEnemyStats());

      expect(result.team[0][CharacterStat.DAMAGE_BONUS]).toBe(6);
    });

    it('returns 0 for an empty operand list', () => {
      const team = [
        makeCharStats({
          [CharacterStat.DAMAGE_BONUS]: [{ type: OperationType.SUM, operands: [] }],
        }),
      ];

      const result = resolve(team, makeEnemyStats());

      expect(result.team[0][CharacterStat.DAMAGE_BONUS]).toBe(0);
    });
  });

  describe('PRODUCT operation', () => {
    it('multiplies all operands', () => {
      const team = [
        makeCharStats({ [CharacterStat.DAMAGE_BONUS]: [product(2, 3, 4)] }),
      ];

      const result = resolve(team, makeEnemyStats());

      expect(result.team[0][CharacterStat.DAMAGE_BONUS]).toBe(24);
    });

    it('returns 1 for an empty operand list', () => {
      const team = [
        makeCharStats({
          [CharacterStat.DAMAGE_BONUS]: [{ type: OperationType.PRODUCT, operands: [] }],
        }),
      ];

      const result = resolve(team, makeEnemyStats());

      expect(result.team[0][CharacterStat.DAMAGE_BONUS]).toBe(1);
    });
  });

  describe('CLAMP operation', () => {
    it('clamps a value below the minimum up to minimum', () => {
      const team = [
        makeCharStats({ [CharacterStat.CRITICAL_RATE]: [clamp(-0.5, 0, 1)] }),
      ];

      expect(resolve(team, makeEnemyStats()).team[0][CharacterStat.CRITICAL_RATE]).toBe(
        0,
      );
    });

    it('clamps a value above the maximum down to maximum', () => {
      const team = [
        makeCharStats({ [CharacterStat.CRITICAL_RATE]: [clamp(1.5, 0, 1)] }),
      ];

      expect(resolve(team, makeEnemyStats()).team[0][CharacterStat.CRITICAL_RATE]).toBe(
        1,
      );
    });

    it('passes through a value that is already within bounds', () => {
      const team = [
        makeCharStats({ [CharacterStat.CRITICAL_RATE]: [clamp(0.6, 0, 1)] }),
      ];

      expect(resolve(team, makeEnemyStats()).team[0][CharacterStat.CRITICAL_RATE]).toBe(
        0.6,
      );
    });
  });

  describe('CONDITIONAL operation', () => {
    it('takes the true branch when > is satisfied', () => {
      const team = [
        makeCharStats({
          [CharacterStat.DAMAGE_BONUS]: [conditional(10, '>', 5, 100, 0)],
        }),
      ];

      expect(resolve(team, makeEnemyStats()).team[0][CharacterStat.DAMAGE_BONUS]).toBe(
        100,
      );
    });

    it('takes the false branch when > is not satisfied', () => {
      const team = [
        makeCharStats({
          [CharacterStat.DAMAGE_BONUS]: [conditional(3, '>', 5, 100, 0)],
        }),
      ];

      expect(resolve(team, makeEnemyStats()).team[0][CharacterStat.DAMAGE_BONUS]).toBe(
        0,
      );
    });

    it('handles >= (equal case → true)', () => {
      const team = [
        makeCharStats({
          [CharacterStat.DAMAGE_BONUS]: [conditional(5, '>=', 5, 100, 0)],
        }),
      ];

      expect(resolve(team, makeEnemyStats()).team[0][CharacterStat.DAMAGE_BONUS]).toBe(
        100,
      );
    });

    it('handles < (less-than case → true)', () => {
      const team = [
        makeCharStats({
          [CharacterStat.DAMAGE_BONUS]: [conditional(3, '<', 5, 100, 0)],
        }),
      ];

      expect(resolve(team, makeEnemyStats()).team[0][CharacterStat.DAMAGE_BONUS]).toBe(
        100,
      );
    });

    it('handles <= (equal case → true)', () => {
      const team = [
        makeCharStats({
          [CharacterStat.DAMAGE_BONUS]: [conditional(5, '<=', 5, 100, 0)],
        }),
      ];

      expect(resolve(team, makeEnemyStats()).team[0][CharacterStat.DAMAGE_BONUS]).toBe(
        100,
      );
    });

    it('takes the false branch when the operand fails reverseThreshold', () => {
      const team = [
        makeCharStats({
          [CharacterStat.DAMAGE_BONUS]: [conditional(6, '>=', 1, 100, 0, 5)],
        }),
      ];

      expect(resolve(team, makeEnemyStats()).team[0][CharacterStat.DAMAGE_BONUS]).toBe(
        0,
      );
    });

    it('uses the reverse comparator for less-than thresholds', () => {
      const team = [
        makeCharStats({
          [CharacterStat.DAMAGE_BONUS]: [conditional(0, '<=', 5, 100, 0, 1)],
        }),
      ];

      expect(resolve(team, makeEnemyStats()).team[0][CharacterStat.DAMAGE_BONUS]).toBe(
        0,
      );
    });
  });

  // ── Nested operations ───────────────────────────────────────────────────

  describe('nested operations', () => {
    it('resolves deeply nested node trees', () => {
      // sum(product(2, 3), clamp(7, 0, 5)) = 6 + 5 = 11
      const node = sum(product(2, 3), clamp(7, 0, 5));
      const team = [makeCharStats({ [CharacterStat.DAMAGE_BONUS]: [node] })];

      expect(resolve(team, makeEnemyStats()).team[0][CharacterStat.DAMAGE_BONUS]).toBe(
        11,
      );
    });

    it('resolves a conditional whose branches are operations', () => {
      // 10 > 5 → product(3, 4) = 12
      const node = conditional(10, '>', 5, product(3, 4), 0);
      const team = [makeCharStats({ [CharacterStat.DAMAGE_BONUS]: [node] })];

      expect(resolve(team, makeEnemyStats()).team[0][CharacterStat.DAMAGE_BONUS]).toBe(
        12,
      );
    });
  });

  // ── Cross-stat references ───────────────────────────────────────────────

  describe('cross-stat references', () => {
    it('resolves a character stat that references an enemy stat', () => {
      // Character's resistancePenetration = enemy's baseResistance × 2
      const team = [
        makeCharStats({
          [CharacterStat.RESISTANCE_PENETRATION]: [
            product(enemyReference(EnemyStat.BASE_RESISTANCE), 2),
          ],
        }),
      ];
      const enemy = makeEnemyStats({ [EnemyStat.BASE_RESISTANCE]: [0.2] });

      const result = resolve(team, enemy);

      expect(result.team[0][CharacterStat.RESISTANCE_PENETRATION]).toBeCloseTo(0.4);
    });

    it('resolves an enemy stat that references a character stat (topo-ordered correctly)', () => {
      // Enemy defenseReduction mirrors character 1's defenseIgnore
      const team = [
        makeCharStats(), // character 0 — unused in this test
        makeCharStats({ [CharacterStat.DEFENSE_IGNORE]: [0.25] }), // character 1
      ];
      const enemy = makeEnemyStats({
        [EnemyStat.DEFENSE_REDUCTION]: [teamReference(1, CharacterStat.DEFENSE_IGNORE)],
      });

      const result = resolve(team, enemy);

      expect(result.enemy[EnemyStat.DEFENSE_REDUCTION]).toBeCloseTo(0.25);
    });

    it('resolves a stat that depends on a stat from a different team member', () => {
      // Character 1's damageBonus copies character 2's criticalRate
      const team = [
        makeCharStats(), // character 0
        makeCharStats({
          [CharacterStat.DAMAGE_BONUS]: [teamReference(2, CharacterStat.CRITICAL_RATE)],
        }), // character 1
        makeCharStats({ [CharacterStat.CRITICAL_RATE]: [0.75] }), // character 2
      ];

      const result = resolve(team, makeEnemyStats());

      expect(result.team[1][CharacterStat.DAMAGE_BONUS]).toBeCloseTo(0.75);
    });
  });

  // ── Multi-character teams ───────────────────────────────────────────────

  describe('multi-character teams', () => {
    it('resolves stats independently for each character', () => {
      const team = [
        makeCharStats({ [CharacterStat.ATTACK_FLAT]: [1000] }),
        makeCharStats({ [CharacterStat.ATTACK_FLAT]: [2000] }),
        makeCharStats({ [CharacterStat.ATTACK_FLAT]: [3000] }),
      ];

      const result = resolve(team, makeEnemyStats());

      expect(result.team[0][CharacterStat.ATTACK_FLAT]).toBe(1000);
      expect(result.team[1][CharacterStat.ATTACK_FLAT]).toBe(2000);
      expect(result.team[2][CharacterStat.ATTACK_FLAT]).toBe(3000);
    });

    it('returns a team array of the same length as the input', () => {
      const team = [makeCharStats(), makeCharStats()];

      expect(resolve(team, makeEnemyStats()).team).toHaveLength(2);
    });
  });

  // ── Cycle breaking ──────────────────────────────────────────────────────
  //
  // When two stats mutually reference each other the topological sort enqueues
  // the alphabetically smaller key first (e.g. "enemy:baseResistance" before
  // "enemy:resistanceReduction"). When the first node is evaluated its cyclic
  // dependency is still an unevaluated tree in the context, so `getPrimitiveValue`
  // returns 0 for it. The resolved value (based on 0) is then stored, and the
  // second node resolves against that stored number normally.

  describe('cycle breaking', () => {
    it('does not throw when stats form a circular dependency', () => {
      // BASE_RESISTANCE → RESISTANCE_REDUCTION → BASE_RESISTANCE (cycle)
      const team = [makeCharStats()];
      const enemy = makeEnemyStats({
        [EnemyStat.BASE_RESISTANCE]: [enemyReference(EnemyStat.RESISTANCE_REDUCTION)],
        [EnemyStat.RESISTANCE_REDUCTION]: [enemyReference(EnemyStat.BASE_RESISTANCE)],
      });

      expect(() => resolve(team, enemy)).not.toThrow();
    });

    it('resolves the alphabetically-first node in the cycle against 0, then its partner against that result', () => {
      // "enemy:baseResistance" < "enemy:resistanceReduction" alphabetically, so
      // baseResistance is evaluated first. Its only operand is a reference to
      // resistanceReduction which is still unresolved → treated as 0 → result = 0.
      // resistanceReduction is then evaluated: baseResistance is now 0 → result = 0.
      const team = [makeCharStats()];
      const enemy = makeEnemyStats({
        [EnemyStat.BASE_RESISTANCE]: [enemyReference(EnemyStat.RESISTANCE_REDUCTION)],
        [EnemyStat.RESISTANCE_REDUCTION]: [enemyReference(EnemyStat.BASE_RESISTANCE)],
      });

      const result = resolve(team, enemy);

      expect(result.enemy[EnemyStat.BASE_RESISTANCE]).toBe(0);
      expect(result.enemy[EnemyStat.RESISTANCE_REDUCTION]).toBe(0);
    });

    it('carries a non-zero value from the first node into its cycle partner', () => {
      // baseResistance = resistanceReduction + 10.
      // Evaluated first (alphabetically): resistanceReduction is unresolved → 0,
      // so baseResistance = 0 + 10 = 10.
      // resistanceReduction = baseResistance (now 10) → 10.
      const team = [makeCharStats()];
      const enemy = makeEnemyStats({
        [EnemyStat.BASE_RESISTANCE]: [
          enemyReference(EnemyStat.RESISTANCE_REDUCTION),
          10,
        ],
        [EnemyStat.RESISTANCE_REDUCTION]: [enemyReference(EnemyStat.BASE_RESISTANCE)],
      });

      const result = resolve(team, enemy);

      expect(result.enemy[EnemyStat.BASE_RESISTANCE]).toBe(10);
      expect(result.enemy[EnemyStat.RESISTANCE_REDUCTION]).toBe(10);
    });

    it('handles a three-node cycle, propagating the seed value through each step', () => {
      // Cycle: baseResistance → defenseReduction → resistanceReduction → baseResistance
      //
      // Topo sort cycle-break picks the alphabetically smallest key first:
      //   "enemy:baseResistance" < "enemy:defenseReduction" < "enemy:resistanceReduction"
      // Enqueuing baseResistance unblocks resistanceReduction (its dependent in the
      // reverse graph), which in turn unblocks defenseReduction.
      // Resolution order: baseResistance → resistanceReduction → defenseReduction.
      //
      // Step 1 — baseResistance = defenseReduction (unresolved → 0) + 10 = 10
      // Step 2 — resistanceReduction = baseResistance (10) = 10
      // Step 3 — defenseReduction = resistanceReduction (10) = 10
      const team = [makeCharStats()];
      const enemy = makeEnemyStats({
        [EnemyStat.BASE_RESISTANCE]: [enemyReference(EnemyStat.DEFENSE_REDUCTION), 10],
        [EnemyStat.DEFENSE_REDUCTION]: [enemyReference(EnemyStat.RESISTANCE_REDUCTION)],
        [EnemyStat.RESISTANCE_REDUCTION]: [enemyReference(EnemyStat.BASE_RESISTANCE)],
      });

      const result = resolve(team, enemy);

      expect(result.enemy[EnemyStat.BASE_RESISTANCE]).toBe(10);
      expect(result.enemy[EnemyStat.RESISTANCE_REDUCTION]).toBe(10);
      expect(result.enemy[EnemyStat.DEFENSE_REDUCTION]).toBe(10);
    });
  });

  // ── Input mutation guard ────────────────────────────────────────────────

  describe('input mutation', () => {
    it('does not modify the original team stat arrays', () => {
      const attackArray = [100, 50];
      const team = [makeCharStats({ [CharacterStat.ATTACK_FLAT]: attackArray })];

      resolve(team, makeEnemyStats());

      expect(attackArray).toEqual([100, 50]);
    });

    it('does not modify the original enemy stat arrays', () => {
      const resistanceArray = [0.1];
      const enemy = makeEnemyStats({ [EnemyStat.BASE_RESISTANCE]: resistanceArray });

      resolve([makeCharStats()], enemy);

      expect(resistanceArray).toEqual([0.1]);
    });
  });
});
