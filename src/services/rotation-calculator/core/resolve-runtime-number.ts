import { clamp, sum } from 'es-toolkit/math';
import { mapValues } from 'es-toolkit/object';
import { isNil } from 'es-toolkit/predicate';

import type { CharacterStat, EnemyStat } from '@/types';

export interface StatParameterizedNumber {
  type: 'statParameterizedNumber';
  stat: CharacterStat | EnemyStat;
  characterIndex?: number;
}

type Primitive = number | StatParameterizedNumber;

export type TeamStats = Array<Record<CharacterStat, Array<NumberNode>>>;

export type EnemyStats = Record<EnemyStat, Array<NumberNode>>;

type NodeKey = string; // e.g. "team:0:hp" or "enemy:defense"

export const OperationType = {
  SUM: 'sum',
  PRODUCT: 'product',
  CLAMP: 'clamp',
  CONDITIONAL: 'conditional',
} as const;

export type OperationType = (typeof OperationType)[keyof typeof OperationType];

interface SumOperation {
  type: typeof OperationType.SUM;
  operands: Array<NumberNode>;
}

interface ProductOperation {
  type: typeof OperationType.PRODUCT;
  operands: Array<NumberNode>;
}

interface ClampOperation {
  type: typeof OperationType.CLAMP;
  operand: NumberNode;
  minimum: number;
  maximum: number;
}

interface ConditionalOperation {
  type: typeof OperationType.CONDITIONAL;
  operand: NumberNode;
  operator: '>' | '>=' | '<' | '<=';
  threshold: NumberNode;
  reverseThreshold?: NumberNode;
  valueIfTrue: NumberNode;
  valueIfFalse: NumberNode;
}

type Operation =
  | SumOperation
  | ProductOperation
  | ClampOperation
  | ConditionalOperation;

export type NumberNode = Operation | Primitive;

/**
 * Resolves every stat in `team` and `enemy` from their `NumberNode` tree
 * representations down to plain numbers.
 *
 * Stats may reference one another via `StatParameterizedNumber` nodes (e.g. a
 * character's resistance-penetration parameterised by the enemy's base-resistance).
 * To handle arbitrary inter-stat dependencies the function:
 *
 *  1. Wraps each stat's operand list in a `SUM` root node.
 *  2. Walks every node tree to collect `StatParameterizedNumber` dependencies.
 *  3. Topologically sorts all stat nodes so each stat is evaluated only after
 *     the stats it depends on (cycles are broken deterministically).
 *  4. Evaluates each stat in topological order, writing the resolved value back
 *     into the shared context so that downstream nodes can read it as a plain
 *     number.
 *
 * @param team  - One record per team member. Each stat holds an array of
 *                `NumberNode` operands that are summed as the implicit root
 *                operation.
 * @param enemy - Enemy stat record using the same operand-array convention.
 * @returns Fully resolved numeric stats for every team member and the enemy.
 */
export const resolveStats = (
  team: TeamStats,
  enemy: EnemyStats,
): {
  team: Array<Record<CharacterStat, number>>;
  enemy: Record<EnemyStat, number>;
} => {
  const teamAsSumNode = team.map((character) =>
    mapValues(character, (stat) => ({
      type: OperationType.SUM,
      operands: stat,
    })),
  );
  const enemyAsSumNode = mapValues(enemy, (stat) => ({
    type: OperationType.SUM,
    operands: stat,
  }));

  // 2. Collect all node keys and their dependencies
  const nodes = new Set<NodeKey>();
  const edges = new Map<NodeKey, Set<NodeKey>>(); // node → its deps

  for (const [index, element] of teamAsSumNode.entries()) {
    for (const [stat, node] of Object.entries(element)) {
      const key = makeKey('team', stat, index);
      nodes.add(key);
      const deps = collectDeps(node).map((reference) =>
        makeKey(
          isNil(reference.characterIndex) ? 'enemy' : 'team',
          reference.stat,
          reference.characterIndex,
        ),
      );
      edges.set(key, new Set(deps));
    }
  }

  for (const [stat, node] of Object.entries(enemyAsSumNode)) {
    const key = makeKey('enemy', stat);
    nodes.add(key);
    const deps = collectDeps(node).map((reference) =>
      makeKey(
        isNil(reference.characterIndex) ? 'enemy' : 'team',
        reference.stat,
        reference.characterIndex,
      ),
    );
    edges.set(key, new Set(deps));
  }

  // 3. Topological sort
  const order = topologicalSort(nodes, edges);

  // 4. Resolve in order, caching results as plain NumberNodes back into the context
  const resolvedTeam = team.map(() => ({}) as Record<CharacterStat, number>);
  const resolvedEnemy = {} as Record<EnemyStat, number>;

  // Context holds already-resolved values as plain number nodes
  const context: {
    team: Array<Record<CharacterStat, NumberNode>>;
    enemy: Record<EnemyStat, NumberNode>;
  } = {
    team: teamAsSumNode,
    enemy: enemyAsSumNode,
  };

  for (const key of order) {
    const [source, ...rest] = key.split(':');

    if (source === 'enemy') {
      const stat = rest.join(':') as EnemyStat;
      const value = resolveRuntimeNumber(context.enemy[stat], context);
      resolvedEnemy[stat] = value;
      // Freeze resolved value in context so downstream nodes see a plain number
      context.enemy[stat] = value;
    } else {
      const characterIndex = Number(rest[0]);
      const stat = rest.slice(1).join(':') as CharacterStat;
      const value = resolveRuntimeNumber(context.team[characterIndex][stat], context);
      resolvedTeam[characterIndex][stat] = value;
      context.team[characterIndex][stat] = value;
    }
  }

  return { team: resolvedTeam, enemy: resolvedEnemy };
};

const COMPARATORS = {
  '>': (left: number, right: number) => left > right,
  '>=': (left: number, right: number) => left >= right,
  '<': (left: number, right: number) => left < right,
  '<=': (left: number, right: number) => left <= right,
} as const;

const REVERSE_COMPARATOR = {
  '>': '<',
  '>=': '<=',
  '<': '>',
  '<=': '>=',
} as const satisfies Record<keyof typeof COMPARATORS, keyof typeof COMPARATORS>;

const isPrimitive = (value: NumberNode): value is Primitive => {
  return typeof value === 'number' || value.type === 'statParameterizedNumber';
};

const getPrimitiveValue = (
  value: Primitive,
  context: {
    team: Array<Record<CharacterStat, NumberNode>>;
    enemy: Record<EnemyStat, NumberNode>;
  },
): number => {
  if (typeof value === 'number') {
    return value;
  }
  if (isNil(value.characterIndex)) {
    const valueNode = context.enemy[value.stat as EnemyStat];
    // If the referenced stat is still an unevaluated tree it has not yet been
    // processed by the outer resolution loop, which means this is a cyclic
    // dependency. The topological sort placed the current node first (it has
    // the alphabetically smaller key), so we treat the missing value as 0
    // and let the cycle partner resolve against our already-stored result.
    if (typeof valueNode !== 'number') return 0;
    return resolveRuntimeNumber(valueNode, context);
  }
  const valueNode = context.team[value.characterIndex][value.stat as CharacterStat];
  // Same cycle-break guard for team-stat references.
  if (typeof valueNode !== 'number') return 0;
  return resolveRuntimeNumber(valueNode, context);
};

/**
 * Recursively evaluates a `NumberNode` tree to a single number.
 *
 * Primitive nodes (`number` or `StatParameterizedNumber`) are resolved
 * immediately via `getPrimitiveValue`. Composite operation nodes dispatch to
 * the appropriate arithmetic reduction.
 *
 * Because `resolveStats` replaces each stat entry in `context` with its
 * resolved value as computation proceeds, this function may encounter either
 * a fully-evaluated `number` or an unevaluated `NumberNode` subtree for any
 * given stat reference. Unevaluated references are only possible in cyclic
 * dependency groups; `getPrimitiveValue` treats them as `0` so that the
 * alphabetically-first node in the cycle can still produce a finite result,
 * after which its cycle partners resolve against that stored value.
 */
const resolveRuntimeNumber = (
  definition: NumberNode,
  context: {
    team: Array<Record<CharacterStat, NumberNode>>;
    enemy: Record<EnemyStat, NumberNode>;
  },
): number => {
  if (isPrimitive(definition)) {
    return getPrimitiveValue(definition, context);
  }
  switch (definition.type) {
    case OperationType.SUM: {
      return sum(
        definition.operands.map((operand) => resolveRuntimeNumber(operand, context)),
      );
    }
    case OperationType.PRODUCT: {
      return definition.operands.reduce(
        (product: number, operand) => product * resolveRuntimeNumber(operand, context),
        1,
      );
    }
    case OperationType.CLAMP: {
      return clamp(
        resolveRuntimeNumber(definition.operand, context),
        definition.minimum,
        definition.maximum,
      );
    }
    case OperationType.CONDITIONAL: {
      const operandValue = resolveRuntimeNumber(definition.operand, context);
      const threshold = resolveRuntimeNumber(definition.threshold, context);
      const reverseThreshold =
        definition.reverseThreshold === undefined
          ? undefined
          : resolveRuntimeNumber(definition.reverseThreshold, context);
      const satisfiesReverseThreshold =
        reverseThreshold === undefined ||
        COMPARATORS[REVERSE_COMPARATOR[definition.operator]](
          operandValue,
          reverseThreshold,
        );

      return COMPARATORS[definition.operator](operandValue, threshold) &&
        satisfiesReverseThreshold
        ? resolveRuntimeNumber(definition.valueIfTrue, context)
        : resolveRuntimeNumber(definition.valueIfFalse, context);
    }
  }
};

const makeKey = (
  source: 'team' | 'enemy',
  stat: string,
  characterIndex?: number,
): NodeKey => (source === 'team' ? `team:${characterIndex}:${stat}` : `enemy:${stat}`);

/** Walks a `NumberNode` tree and returns every `StatParameterizedNumber` leaf found. */
const collectDeps = (node: NumberNode): Array<StatParameterizedNumber> => {
  if (typeof node === 'number') return [];
  if (node.type === 'statParameterizedNumber') return [node];

  switch (node.type) {
    case OperationType.SUM:
    case OperationType.PRODUCT: {
      return node.operands.flatMap((operand) => collectDeps(operand));
    }
    case OperationType.CLAMP: {
      return collectDeps(node.operand);
    }
    case OperationType.CONDITIONAL: {
      return [
        ...collectDeps(node.operand),
        ...collectDeps(node.threshold),
        ...(node.reverseThreshold === undefined
          ? []
          : collectDeps(node.reverseThreshold)),
        ...collectDeps(node.valueIfTrue),
        ...collectDeps(node.valueIfFalse),
      ];
    }
  }
};

/**
 * Orders `nodes` so that every node appears after all nodes it depends on
 * (Kahn's algorithm).
 *
 * If a cycle is detected (the ready queue empties before all nodes are placed)
 * the alphabetically smallest remaining node is forcibly enqueued to break the
 * cycle. This ensures a deterministic, complete ordering even for cyclic graphs,
 * at the cost of evaluating one node in the cycle before its dependency is
 * resolved (it will read whatever value happens to be in the context at that
 * point).
 *
 * @param nodes - Complete set of stat node keys.
 * @param edges - Map from each node key to the set of keys it depends on.
 * @returns A topologically sorted array of node keys.
 */
const topologicalSort = (
  nodes: Set<NodeKey>,
  edges: Map<NodeKey, Set<NodeKey>>, // key → keys it depends on
): Array<NodeKey> => {
  // Build reverse: dependency → dependents, and in-degree count
  const inDegree = new Map<NodeKey, number>();
  const dependents = new Map<NodeKey, Set<NodeKey>>();

  for (const key of nodes) {
    if (!inDegree.has(key)) inDegree.set(key, 0);
    if (!dependents.has(key)) dependents.set(key, new Set());
  }

  for (const [key, deps] of edges) {
    for (const dep of deps) {
      if (!nodes.has(dep)) continue; // dep is external / unknown — skip
      dependents.get(dep)!.add(key);
      inDegree.set(key, (inDegree.get(key) ?? 0) + 1);
    }
  }

  const queue: Array<NodeKey> = [...nodes]
    .filter((k) => inDegree.get(k) === 0)
    .toSorted();
  const sorted: Array<NodeKey> = [];

  while (sorted.length < nodes.size) {
    if (queue.length === 0) {
      // Cycle detected — break it by picking the alphabetically smallest
      // remaining node (consistent, deterministic tie-break)
      const remaining = [...nodes]
        .filter((k) => !sorted.includes(k) && !queue.includes(k))
        .toSorted();
      queue.push(remaining[0]);
    }

    const key = queue.shift()!;
    sorted.push(key);

    const deps = [...(dependents.get(key) ?? [])].toSorted();
    for (const dependent of deps) {
      const newDegree = (inDegree.get(dependent) ?? 1) - 1;
      inDegree.set(dependent, newDegree);
      if (newDegree === 0) queue.push(dependent);
    }
  }

  return sorted;
};
