import { describe, expect, it } from 'vitest';

import { CharacterStat } from '@/types';

import { identifyRuntimeStats } from './identify-runtime-stats';

const makeEntity = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 1,
    name: 'Test Character',
    capabilities: {
      attacks: [],
      modifiers: [],
      permanentStats: [],
    },
    ...overrides,
  }) as any;

const makeModifier = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 1,
    capabilityType: 'modifier',
    name: 'Modifier',
    originType: 'Inherent Skill',
    modifiedStats: [],
    ...overrides,
  }) as any;

const makePermanentStat = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 1,
    capabilityType: 'permanent_stat',
    name: 'Permanent Stat',
    originType: 'Inherent Skill',
    stat: CharacterStat.DAMAGE_BONUS,
    tags: ['all'],
    value: 0,
    ...overrides,
  }) as any;

describe('identifyRuntimeStats', () => {
  it('identifies a 250% energy regen requirement from a clamp', () => {
    const runtimeStats = identifyRuntimeStats(
      makeEntity({
        capabilities: {
          attacks: [],
          modifiers: [
            makeModifier({
              modifiedStats: [
                {
                  stat: CharacterStat.CRITICAL_RATE,
                  tags: ['all'],
                  target: 'team',
                  value: {
                    type: 'product',
                    operands: [
                      0.05,
                      {
                        type: 'clamp',
                        maximum: 2.5,
                        minimum: 0,
                        operand: {
                          type: 'statParameterizedNumber',
                          stat: CharacterStat.ENERGY_REGEN,
                          resolveWith: 'self',
                        },
                      },
                    ],
                  },
                },
              ],
            }),
          ],
          permanentStats: [],
        },
      }),
    );

    expect(runtimeStats).toEqual([
      {
        stat: CharacterStat.ENERGY_REGEN,
        requiredTotal: 2.5,
      },
    ]);
  });

  it('identifies a 260% energy regen requirement from an offset conditional', () => {
    const runtimeStats = identifyRuntimeStats(
      makeEntity({
        capabilities: {
          attacks: [],
          modifiers: [
            makeModifier({
              modifiedStats: [
                {
                  stat: CharacterStat.DAMAGE_BONUS,
                  tags: ['all'],
                  target: 'team',
                  value: {
                    type: 'conditional',
                    operand: {
                      type: 'product',
                      operands: [
                        0.25,
                        {
                          type: 'clamp',
                          maximum: 1.6,
                          minimum: 0,
                          operand: {
                            type: 'sum',
                            operands: [
                              {
                                type: 'statParameterizedNumber',
                                stat: CharacterStat.ENERGY_REGEN,
                                resolveWith: 'self',
                              },
                              -1,
                            ],
                          },
                        },
                      ],
                    },
                    operator: '<=',
                    threshold: 0.4,
                    valueIfTrue: 0.4,
                    valueIfFalse: 0.4,
                  },
                },
              ],
            }),
          ],
          permanentStats: [],
        },
      }),
    );

    expect(runtimeStats).toEqual([
      {
        stat: CharacterStat.ENERGY_REGEN,
        requiredTotal: 2.6,
      },
    ]);
  });

  it('identifies a 150% energy regen requirement from a permanent stat conversion', () => {
    const runtimeStats = identifyRuntimeStats(
      makeEntity({
        capabilities: {
          attacks: [],
          modifiers: [],
          permanentStats: [
            makePermanentStat({
              stat: CharacterStat.DAMAGE_BONUS,
              tags: ['echo'],
              value: {
                type: 'clamp',
                maximum: 0.5,
                minimum: 0,
                operand: {
                  type: 'product',
                  operands: [
                    2,
                    {
                      type: 'sum',
                      operands: [
                        {
                          type: 'statParameterizedNumber',
                          stat: CharacterStat.ENERGY_REGEN,
                          resolveWith: 'self',
                        },
                        -1.25,
                      ],
                    },
                  ],
                },
              },
            }),
          ],
        },
      }),
    );

    expect(runtimeStats).toEqual([
      {
        stat: CharacterStat.ENERGY_REGEN,
        requiredTotal: 1.5,
      },
    ]);
  });

  it('ignores enemy stat references and keeps the highest requirement per stat', () => {
    const runtimeStats = identifyRuntimeStats(
      makeEntity({
        capabilities: {
          attacks: [],
          modifiers: [
            makeModifier({
              modifiedStats: [
                {
                  stat: CharacterStat.CRITICAL_DAMAGE,
                  tags: ['all'],
                  target: 'self',
                  value: {
                    type: 'conditional',
                    operand: {
                      type: 'product',
                      operands: [
                        0.5,
                        {
                          type: 'clamp',
                          maximum: 2,
                          minimum: 0,
                          operand: {
                            type: 'statParameterizedNumber',
                            stat: CharacterStat.ATTACK_SCALING_BONUS,
                            resolveWith: 'self',
                          },
                        },
                      ],
                    },
                    operator: '<=',
                    threshold: 1,
                    valueIfTrue: 1,
                    valueIfFalse: 1,
                  },
                },
                {
                  stat: CharacterStat.DAMAGE_BONUS,
                  tags: ['all'],
                  target: 'enemy',
                  value: {
                    type: 'clamp',
                    maximum: 0.5,
                    minimum: 0,
                    operand: {
                      type: 'statParameterizedNumber',
                      stat: 'baseResistance',
                      resolveWith: 'enemy',
                    },
                  },
                },
              ],
            }),
            makeModifier({
              modifiedStats: [
                {
                  stat: CharacterStat.CRITICAL_RATE,
                  tags: ['all'],
                  target: 'self',
                  value: {
                    type: 'clamp',
                    maximum: 1.6,
                    minimum: 0,
                    operand: {
                      type: 'statParameterizedNumber',
                      stat: CharacterStat.ATTACK_SCALING_BONUS,
                      resolveWith: 'self',
                    },
                  },
                },
              ],
            }),
          ],
          permanentStats: [],
        },
      }),
    );

    expect(runtimeStats).toEqual([
      {
        stat: CharacterStat.ATTACK_SCALING_BONUS,
        requiredTotal: 2,
      },
    ]);
  });
});
