import { mapAsync } from 'es-toolkit/array';

import type { AttackInstance, ModifierInstance } from '@/schemas/rotation';
import type { Team as ClientTeam } from '@/schemas/team';
import {
  filterAndResolveCapabilities,
  isAttack,
  isModifier,
  isPermanentStat,
  listEntityCapabilities,
} from '@/services/game-data';
import type { ResolvedCapability } from '@/services/game-data/list-entity-capabilities.function';

/**
 * Error thrown when game data is not found.
 */
export class GameDataNotFoundError extends Error {
  constructor(
    message: string,
    public readonly entityId?: number,
    public readonly entityType?: 'attack' | 'modifier',
  ) {
    super(message);
    this.name = 'GameDataNotFoundError';
  }
}

type IndexedResolvedCapability = ResolvedCapability & { characterIndex: number };
type IndexedAttack = Extract<
  IndexedResolvedCapability,
  { capabilityJson: { type: 'attack' } }
>;
type IndexedModifier = Extract<
  IndexedResolvedCapability,
  { capabilityJson: { type: 'modifier' } }
>;
type IndexedPermanentStat = Extract<
  IndexedResolvedCapability,
  { capabilityJson: { type: 'permanent_stat' } }
>;

const withCharacterId = <TCapability extends ResolvedCapability>(
  capabilities: Array<TCapability>,
  characterIndex: number,
) => {
  return capabilities.map((capability) => ({
    ...capability,
    characterIndex,
  }));
};

/**
 * Creates a game data enricher for a specific team configuration.
 * Fetches all necessary game data upfront and returns curried methods for enrichment.
 *
 * @param clientTeam - The team configuration
 * @returns Object with methods to enrich attacks, modifiers, and get permanent stats
 */
export const createGameDataEnricher = async (clientTeam: ClientTeam) => {
  const { attacks, modifiers, permanentStats } =
    await fetchRotationGameData(clientTeam);

  const attackEnricher = createEnricher(attacks, 'attack');
  const modifierEnricher = createEnricher(modifiers, 'modifier');

  return {
    /**
     * Enriches an attack instance with its full attack details.
     */
    enrichAttack: (attack: AttackInstance): AttackInstance & IndexedAttack => {
      return attackEnricher(attack);
    },

    /**
     * Enriches a modifier instance with its full modifier details.
     */
    enrichModifier: (
      modifier: ModifierInstance,
    ): ModifierInstance & IndexedModifier => {
      return modifierEnricher(modifier);
    },

    /**
     * Gets permanent stats for a character at the specified index.
     * Includes stats from the character, weapon, echo, and echo sets.
     */
    getPermanentStatsForCharacter: (
      characterIndex: number,
    ): Array<IndexedPermanentStat> => {
      return permanentStats.filter((stat) => stat.characterIndex === characterIndex);
    },
  };
};

/**
 * Fetches all game data needed for rotation calculation.
 * Retrieves entity details for characters, weapons, echoes, and echo sets.
 * @throws GameDataFetchError if any entity data fails to load
 * TODO: There has to be a cleaner way to do this...
 */
const fetchRotationGameData = async (clientTeam: ClientTeam) => {
  try {
    const [
      echoCapabilities,
      characterCapabilities,
      weaponCapabilities,
      echoSetCapabilities,
    ] = await Promise.all([
      mapAsync(clientTeam, async (c, index) =>
        withCharacterId(
          filterAndResolveCapabilities(
            await listEntityCapabilities({
              data: {
                id: c.primarySlotEcho.id,
              },
            }),
            {},
          ),
          index,
        ),
      ),
      mapAsync(clientTeam, async (c, index) =>
        withCharacterId(
          filterAndResolveCapabilities(
            await listEntityCapabilities({
              data: {
                id: c.id,
              },
            }),
            { sequence: c.sequence },
          ),
          index,
        ),
      ),
      mapAsync(clientTeam, async (c, index) =>
        withCharacterId(
          filterAndResolveCapabilities(
            await listEntityCapabilities({
              data: {
                id: c.weapon.id,
              },
            }),
            { refineLevel: c.weapon.refine },
          ),
          index,
        ),
      ),
      mapAsync(clientTeam, (c, index) =>
        Promise.all(
          c.echoSets.map(async (set) =>
            withCharacterId(
              filterAndResolveCapabilities(
                await listEntityCapabilities({
                  data: {
                    id: set.id,
                  },
                }),
                {
                  activatedSetBonus: Number.parseInt(set.requirement) as 2 | 3 | 5,
                },
              ),
              index,
            ),
          ),
        ),
      ),
    ]);

    const capabilities = [
      ...echoCapabilities.flat(),
      ...characterCapabilities.flat(),
      ...weaponCapabilities.flat(),
      ...echoSetCapabilities.flat().flat(),
    ];
    const modifiers = capabilities.filter((capability) => isModifier(capability));
    const attacks = capabilities.filter((capability) => isAttack(capability));
    const permanentStats = capabilities.filter((capability) =>
      isPermanentStat(capability),
    );

    return {
      modifiers,
      attacks,
      permanentStats,
    };
  } catch {
    throw new GameDataNotFoundError(
      'Failed to fetch game data for team. Please ensure all team members, weapons, and echoes are configured correctly.',
    );
  }
};

/**
 * Creates a function that enriches capability instances with their full details.
 * Uses a Map for O(1) lookups.
 *
 * @param store - Array of capabilities with full details
 * @param entityType - Type of entity being enriched (for error messages)
 * @returns Function that enriches an instance with its details
 * @throws GameDataNotFoundError if capability details are not found for a given ID
 */
const createEnricher = <TCapability extends { id: number }>(
  store: Array<TCapability>,
  entityType: 'attack' | 'modifier',
) => {
  const map = new Map(store.map((s) => [s.id, s]));

  return <T extends { id: number }>(base: T): T & TCapability => {
    const details = map.get(base.id);
    if (!details) {
      throw new GameDataNotFoundError(
        `${entityType} details not found for entity with ID ${base.id}`,
        base.id,
        entityType,
      );
    }
    return {
      ...base,
      ...details,
    };
  };
};
