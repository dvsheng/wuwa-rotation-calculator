import type { BaseEntity, GameDataNumberNode } from '@/services/game-data';
import { isGameDataStatParameterizedNumber } from '@/services/game-data';
import { CharacterStat } from '@/types';
import type { CharacterStat as CharacterStatType, EnemyStat } from '@/types';

import type { RuntimeStatTarget } from './types';

type LinearForm = {
  coefficient: number;
  constant: number;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isCharacterStat = (
  stat: CharacterStatType | EnemyStat,
): stat is CharacterStatType => {
  return Object.values(CharacterStat).includes(stat as CharacterStatType);
};

const getReferencedSelfStats = (
  node: GameDataNumberNode | number,
): Set<CharacterStatType> => {
  if (typeof node === 'number') {
    return new Set();
  }

  if (isGameDataStatParameterizedNumber(node)) {
    return node.resolveWith === 'self' && isCharacterStat(node.stat)
      ? new Set([node.stat])
      : new Set();
  }

  if (!isObject(node) || !('type' in node)) {
    return new Set();
  }

  switch (node.type) {
    case 'sum':
    case 'product': {
      return node.operands.reduce((stats, operand) => {
        for (const stat of getReferencedSelfStats(operand)) {
          stats.add(stat);
        }
        return stats;
      }, new Set<CharacterStatType>());
    }
    case 'clamp': {
      const stats = getReferencedSelfStats(node.operand);

      for (const stat of getReferencedSelfStats(node.minimum)) {
        stats.add(stat);
      }

      for (const stat of getReferencedSelfStats(node.maximum)) {
        stats.add(stat);
      }

      return stats;
    }
    case 'conditional': {
      const stats = getReferencedSelfStats(node.operand);

      for (const stat of getReferencedSelfStats(node.threshold)) {
        stats.add(stat);
      }
      for (const stat of getReferencedSelfStats(node.valueIfTrue)) {
        stats.add(stat);
      }
      for (const stat of getReferencedSelfStats(node.valueIfFalse)) {
        stats.add(stat);
      }

      return stats;
    }
    default: {
      return new Set();
    }
  }
};

const combineLinearForms = (left: LinearForm, right: LinearForm): LinearForm => ({
  coefficient: left.coefficient + right.coefficient,
  constant: left.constant + right.constant,
});

const scaleLinearForm = (form: LinearForm, scale: number): LinearForm => ({
  coefficient: form.coefficient * scale,
  constant: form.constant * scale,
});

const toLinearForm = (
  node: GameDataNumberNode | number,
  stat: CharacterStatType,
): LinearForm | undefined => {
  if (typeof node === 'number') {
    return { coefficient: 0, constant: node };
  }

  if (isGameDataStatParameterizedNumber(node)) {
    if (node.resolveWith === 'self' && node.stat === stat) {
      return { coefficient: 1, constant: 0 };
    }

    return undefined;
  }

  if (!isObject(node) || !('type' in node)) {
    return undefined;
  }

  switch (node.type) {
    case 'sum': {
      let result: LinearForm = { coefficient: 0, constant: 0 };

      for (const operand of node.operands) {
        const operandForm = toLinearForm(operand, stat);
        if (!operandForm) {
          return undefined;
        }

        result = combineLinearForms(result, operandForm);
      }

      return result;
    }
    case 'product': {
      let variable: LinearForm | undefined;
      let constantScale = 1;

      for (const operand of node.operands) {
        const operandForm = toLinearForm(operand, stat);
        if (!operandForm) {
          return undefined;
        }

        if (operandForm.coefficient === 0) {
          constantScale *= operandForm.constant;
          continue;
        }

        if (variable) {
          return undefined;
        }

        variable = operandForm;
      }

      return variable
        ? scaleLinearForm(variable, constantScale)
        : { coefficient: 0, constant: constantScale };
    }
    default: {
      return undefined;
    }
  }
};

const solveForTarget = (form: LinearForm, targetValue: number): number | undefined => {
  if (form.coefficient === 0) {
    return undefined;
  }

  const solved = (targetValue - form.constant) / form.coefficient;
  if (!Number.isFinite(solved) || solved <= 0) {
    return undefined;
  }

  return solved;
};

const maybeAddRuntimeTarget = (
  runtimeTargets: Map<CharacterStatType, number>,
  stat: CharacterStatType,
  requiredTotal: number | undefined,
) => {
  if (!requiredTotal || requiredTotal <= 0) {
    return;
  }

  runtimeTargets.set(stat, Math.max(runtimeTargets.get(stat) ?? 0, requiredTotal));
};

const extractRuntimeTargetsFromNode = (
  node: GameDataNumberNode | number,
  runtimeTargets: Map<CharacterStatType, number>,
) => {
  if (typeof node === 'number' || !isObject(node) || !('type' in node)) {
    return;
  }

  if (node.type === 'clamp') {
    const referencedStats = [...getReferencedSelfStats(node.operand)];

    if (referencedStats.length === 1 && typeof node.maximum === 'number') {
      const stat = referencedStats[0];
      const form = toLinearForm(node.operand, stat);
      if (form) {
        maybeAddRuntimeTarget(runtimeTargets, stat, solveForTarget(form, node.maximum));
      }
    }

    extractRuntimeTargetsFromNode(node.operand, runtimeTargets);
    extractRuntimeTargetsFromNode(node.minimum, runtimeTargets);
    extractRuntimeTargetsFromNode(node.maximum, runtimeTargets);
    return;
  }

  if (node.type === 'conditional') {
    const referencedStats = [...getReferencedSelfStats(node.operand)];

    if (referencedStats.length === 1 && typeof node.threshold === 'number') {
      const stat = referencedStats[0];
      const form = toLinearForm(node.operand, stat);
      if (form) {
        maybeAddRuntimeTarget(
          runtimeTargets,
          stat,
          solveForTarget(form, node.threshold),
        );
      }
    }

    extractRuntimeTargetsFromNode(node.operand, runtimeTargets);
    extractRuntimeTargetsFromNode(node.threshold, runtimeTargets);
    extractRuntimeTargetsFromNode(node.valueIfTrue, runtimeTargets);
    extractRuntimeTargetsFromNode(node.valueIfFalse, runtimeTargets);
    return;
  }

  switch (node.type) {
    case 'sum':
    case 'product': {
      for (const operand of node.operands) {
        extractRuntimeTargetsFromNode(operand, runtimeTargets);
      }
      break;
    }
    default: {
      break;
    }
  }
};

export const identifyRuntimeStats = (entity: BaseEntity): Array<RuntimeStatTarget> => {
  const runtimeTargets = new Map<CharacterStatType, number>();

  for (const permanentStat of entity.capabilities.permanentStats) {
    extractRuntimeTargetsFromNode(permanentStat.value, runtimeTargets);
  }

  for (const modifier of entity.capabilities.modifiers) {
    for (const modifiedStat of modifier.modifiedStats) {
      extractRuntimeTargetsFromNode(modifiedStat.value, runtimeTargets);
    }
  }

  return [...runtimeTargets.entries()]
    .map(([stat, requiredTotal]) => ({ stat, requiredTotal }))
    .toSorted((left, right) => right.requiredTotal - left.requiredTotal);
};
