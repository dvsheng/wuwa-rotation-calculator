import { compact } from 'es-toolkit';

import { ExtraEffectID, ManageBuffAction } from './buffs/constants';
import type { Buff, Damage } from './repostiory';
import { buffs, damage } from './repostiory';

const idDelimiter = '#';

const databaseBuffs = await buffs.list();

const databaseDamage = await damage.list();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns all buffs whose numeric ID string starts with `prefix`.
 * O(|prefix| + result size) via the trie.
 */
export const getBuffsByPrefix = (prefix: string): Array<Buff> => {
  let node: TrieNode | undefined = buffTrie;
  for (const ch of prefix) {
    node = node.children.get(ch);
    if (!node) return [];
  }
  const ids: Array<number> = [];
  collectIds(node, ids);
  return compact(ids.map((id) => buffRepository.get(id)));
};

/**
 * Returns all damage instances whose numeric ID string starts with `prefix`.
 * O(|prefix| + result size) via the trie.
 */
export const getDamageByPrefix = (prefix: string): Array<Damage> => {
  let node: TrieNode | undefined = damageTrie;
  for (const ch of prefix) {
    node = node.children.get(ch);
    if (!node) return [];
  }
  const ids: Array<number> = [];
  collectIds(node, ids);
  return compact(ids.map((id) => damageRepository.get(id)));
};

/**
 * Returns all buffs reachable from `buffId` via the buff graph (BFS).
 * Includes the starting buff itself. Handles cycles.
 */
export const getConnectedBuffs = (buffId: number): Array<Buff> => {
  const visited = new Set<number>();
  const queue: Array<number> = [buffId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    for (const childId of buffGraph.get(id) ?? []) {
      if (!visited.has(childId)) queue.push(childId);
    }
  }
  return compact([...visited].map((id) => buffRepository.get(id)));
};

export const buffRepository = new Map(databaseBuffs.map((buff) => [buff.id, buff]));

export const damageRepository = new Map(databaseDamage.map((dmg) => [dmg.id, dmg]));

export const getIdsFromString = (string_: string): Array<number> =>
  string_.split(idDelimiter).map((id) => Number.parseInt(id));

// ---------------------------------------------------------------------------
// Helpers — defined before graph/trie construction so they can be used inline
// ---------------------------------------------------------------------------

const getBuffChildren = (buffId: number): Array<Buff> => {
  const buff = buffRepository.get(buffId);
  if (!buff) return [];
  const children: Array<number> = [
    ...(buff.extraEffectId === ExtraEffectID.ApplyBuff
      ? getIdsFromString(buff.extraEffectParameters[2])
      : []),
    ...(buff.extraEffectId === ExtraEffectID.ManageBuff &&
    Number.parseInt(buff.extraEffectParameters[0] ?? '') === ManageBuffAction.Apply
      ? getIdsFromString(buff.extraEffectParameters[1])
      : []),
    ...buff.relatedExtraEffectBuffId,
    ...buff.prematureExpirationEffects,
  ];
  return compact(children.map((id) => buffRepository.get(id)));
};

// ---------------------------------------------------------------------------
// Trie
// ---------------------------------------------------------------------------

interface TrieNode {
  children: Map<string, TrieNode>;
  /** IDs whose full string key ends exactly at this node */
  ids: Array<number>;
}

const makeNode = (): TrieNode => ({ children: new Map(), ids: [] });

const buildTrie = (items: ReadonlyArray<{ id: number }>): TrieNode => {
  const root = makeNode();
  for (const item of items) {
    let node = root;
    for (const ch of String(item.id)) {
      let child = node.children.get(ch);
      if (!child) {
        child = makeNode();
        node.children.set(ch, child);
      }
      node = child;
    }
    node.ids.push(item.id);
  }
  return root;
};

const collectIds = (node: TrieNode, out: Array<number>): void => {
  out.push(...node.ids);
  for (const child of node.children.values()) collectIds(child, out);
};

const buffTrie = buildTrie(databaseBuffs);
const damageTrie = buildTrie(databaseDamage);

// ---------------------------------------------------------------------------
// Graph — undirected adjacency list between connected buffs
// ---------------------------------------------------------------------------

const buffGraph = new Map<number, Set<number>>();

for (const buff of databaseBuffs) {
  const children = getBuffChildren(buff.id).map((childBuff) => childBuff.id);
  const parentNeighbors = buffGraph.get(buff.id) ?? new Set<number>();

  for (const childId of children) {
    parentNeighbors.add(childId);

    const childNeighbors = buffGraph.get(childId) ?? new Set<number>();
    childNeighbors.add(buff.id);
    buffGraph.set(childId, childNeighbors);
  }

  buffGraph.set(buff.id, parentNeighbors);
}
