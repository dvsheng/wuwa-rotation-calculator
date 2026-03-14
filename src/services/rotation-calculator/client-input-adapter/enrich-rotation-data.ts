import { mapAsync, zip } from 'es-toolkit/array';

import type { AttackInstance, ModifierInstance } from '@/schemas/rotation';
import type { Team as ClientTeam } from '@/schemas/team';
import type {
  Attack,
  BaseCapability,
  BaseEntity,
  Modifier as GameDataModifier,
  PermanentStat,
} from '@/services/game-data';
import { getEntityById } from '@/services/game-data';

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

/**
 * Creates a game data enricher for a specific team configuration.
 * Fetches all necessary game data upfront and returns curried methods for enrichment.
 *
 * @param clientTeam - The team configuration
 * @returns Object with methods to enrich attacks, modifiers, and get permanent stats
 */
export const createGameDataEnricher = async (clientTeam: ClientTeam) => {
  const { entityDetailsByCharacterIndex, modifierDetails, attackDetails } =
    await fetchRotationGameData(clientTeam);

  const attackEnricher = createEnricher(attackDetails, 'attack');
  const modifierEnricher = createEnricher(modifierDetails, 'modifier');

  return {
    /**
     * Enriches an attack instance with its full attack details.
     */
    enrichAttack: (attack: AttackInstance): AttackInstance & Attack => {
      return attackEnricher(attack);
    },

    /**
     * Enriches a modifier instance with its full modifier details.
     */
    enrichModifier: (
      modifier: ModifierInstance,
    ): ModifierInstance & GameDataModifier => {
      return modifierEnricher(modifier);
    },

    /**
     * Gets permanent stats for a character at the specified index.
     * Includes stats from the character, weapon, echo, and echo sets.
     */
    getPermanentStatsForCharacter: (characterIndex: number): Array<PermanentStat> => {
      return entityDetailsByCharacterIndex[characterIndex].flatMap(
        (entity) => entity.capabilities.permanentStats,
      );
    },
  };
};

/**
 * Fetches all game data needed for rotation calculation.
 * Retrieves entity details for characters, weapons, echoes, and echo sets.
 * @throws GameDataFetchError if any entity data fails to load
 */
const fetchRotationGameData = async (clientTeam: ClientTeam) => {
  try {
    const [echoDetails, characterDetails, weaponDetails, echoSetDetails] =
      await Promise.all([
        mapAsync(clientTeam, (c) =>
          getEntityById({
            data: { id: c.primarySlotEcho.id, entityType: 'echo' },
          }),
        ),
        mapAsync(clientTeam, (c) =>
          getEntityById({
            data: {
              id: c.id,
              entityType: 'character',
              activatedSequence: c.sequence,
            },
          }),
        ),
        mapAsync(clientTeam, (c) =>
          getEntityById({
            data: {
              id: c.weapon.id,
              entityType: 'weapon',
              refineLevel: c.weapon.refine,
            },
          }),
        ),
        mapAsync(clientTeam, (c) =>
          Promise.all(
            c.echoSets.map((set) =>
              getEntityById({
                data: {
                  id: set.id,
                  entityType: 'echo_set',
                  activatedSetBonus: Number.parseInt(set.requirement),
                },
              }),
            ),
          ),
        ),
      ]);

    const entityDetailsByCharacterIndex: Array<Array<BaseEntity>> = zip(
      characterDetails,
      weaponDetails,
      echoDetails,
      echoSetDetails,
    ).map(([character, weapon, echo, echoSets]) => {
      return [character, weapon, echo, ...echoSets];
    });

    const allEntityDetails = entityDetailsByCharacterIndex.flat();
    const modifierDetails = allEntityDetails.flatMap(
      (entity) => entity.capabilities.modifiers,
    );
    const attackDetails = allEntityDetails.flatMap(
      (entity) => entity.capabilities.attacks,
    );

    return {
      entityDetailsByCharacterIndex,
      modifierDetails,
      attackDetails,
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
const createEnricher = <TCapability extends BaseCapability>(
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
