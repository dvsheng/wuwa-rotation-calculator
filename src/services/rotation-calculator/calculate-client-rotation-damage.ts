import { createServerFn } from '@tanstack/react-start';

import type { Enemy as ClientEnemy } from '@/schemas/enemy';
import { CalculateRotationInputSchema } from '@/schemas/game-data-service';
import type { AttackInstance, ModifierInstance } from '@/schemas/rotation';
import type { Team as ClientTeam } from '@/schemas/team';

import { adaptClientInputToRotation } from './client-input-adapter/adapt-client-input-to-rotation';
import { GameDataNotFoundError } from './client-input-adapter/enrich-rotation-data';
import type { ClientRotationResult } from './client-output-adapter/adapt-rotation-result-to-client-output';
import { adaptRotationResultToClientOutput } from './client-output-adapter/adapt-rotation-result-to-client-output';
import { calculateRotationDamage } from './core/calculate-rotation-damage';

/**
 * Orchestrates the rotation damage calculation by adapting client inputs
 * to a Rotation object and passing it to the damage calculator.
 */
export const calculateRotationHandler = async (
  clientTeam: ClientTeam,
  clientEnemy: ClientEnemy,
  attacks: Array<AttackInstance>,
  buffs: Array<ModifierInstance>,
): Promise<ClientRotationResult> => {
  const rotation = await adaptClientInputToRotation(
    clientTeam,
    clientEnemy,
    attacks,
    buffs,
  );
  return adaptRotationResultToClientOutput(calculateRotationDamage(rotation));
};

export const calculateRotation = createServerFn({
  method: 'POST',
})
  .inputValidator(CalculateRotationInputSchema)
  .handler(async ({ data }) => {
    try {
      return calculateRotationHandler(data.team, data.enemy, data.attacks, data.buffs);
    } catch (error) {
      console.error(error);

      if (error instanceof GameDataNotFoundError) {
        throw new Error(`Unable to calculate rotation: ${error.message}`);
      }

      throw new Error('Failed to calculate rotation damage');
    }
  });
