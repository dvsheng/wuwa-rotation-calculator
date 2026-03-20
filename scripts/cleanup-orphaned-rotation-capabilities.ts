import { asc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { capabilities, rotations } from '@/db/schema';
import * as schema from '@/db/schema';
import { SavedRotationDataSchema } from '@/schemas/library';
import type { SavedRotationData } from '@/schemas/library';
import { CapabilityType } from '@/services/game-data';

export interface RotationCleanupSummary {
  id: number;
  name: string;
  removedAttackCount: number;
  removedBuffCount: number;
}

export interface RotationCleanupResult {
  cleanedData: SavedRotationData;
  removedAttackCount: number;
  removedBuffCount: number;
}

export function removeOrphanedCapabilitiesFromRotationData(
  data: SavedRotationData,
  capabilityTypesById: Map<number, string>,
): RotationCleanupResult {
  const cleanedAttacks = data.attacks.filter(
    (attack) => capabilityTypesById.get(attack.id) === CapabilityType.ATTACK,
  );
  const cleanedBuffs = data.buffs.filter(
    (buff) => capabilityTypesById.get(buff.id) === CapabilityType.MODIFIER,
  );

  return {
    cleanedData: {
      ...data,
      attacks: cleanedAttacks,
      buffs: cleanedBuffs,
    },
    removedAttackCount: data.attacks.length - cleanedAttacks.length,
    removedBuffCount: data.buffs.length - cleanedBuffs.length,
  };
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL must be set to run this cleanup script.');
  }

  const sql = postgres(databaseUrl);
  const database = drizzle(sql, { schema });
  const dryRun = process.argv.includes('--dry-run');

  try {
    const [capabilityRows, rotationRows] = await Promise.all([
      database
        .select({
          id: capabilities.id,
          capabilityJson: capabilities.capabilityJson,
        })
        .from(capabilities),
      database
        .select({
          id: rotations.id,
          name: rotations.name,
          data: rotations.data,
        })
        .from(rotations)
        .orderBy(asc(rotations.id)),
    ]);

    const capabilityTypesById = new Map(
      capabilityRows.map((row) => [row.id, row.capabilityJson.type]),
    );
    const affectedRotations: Array<
      RotationCleanupSummary & {
        cleanedData: SavedRotationData;
      }
    > = [];

    for (const rotation of rotationRows) {
      const parsedData = SavedRotationDataSchema.parse(rotation.data);
      const { cleanedData, removedAttackCount, removedBuffCount } =
        removeOrphanedCapabilitiesFromRotationData(parsedData, capabilityTypesById);

      if (removedAttackCount === 0 && removedBuffCount === 0) {
        continue;
      }

      affectedRotations.push({
        id: rotation.id,
        name: rotation.name,
        cleanedData,
        removedAttackCount,
        removedBuffCount,
      });
    }

    if (!dryRun && affectedRotations.length > 0) {
      await database.transaction(async (tx) => {
        for (const rotation of affectedRotations) {
          await tx
            .update(rotations)
            .set({
              data: rotation.cleanedData,
              updatedAt: new Date(),
            })
            .where(eq(rotations.id, rotation.id));
        }
      });
    }

    console.log(
      dryRun
        ? 'Dry run complete. Rotations that would be updated:'
        : 'Cleanup complete. Updated rotations:',
    );

    console.table(
      affectedRotations.map((rotation) => ({
        id: rotation.id,
        name: rotation.name,
        removedAttacks: rotation.removedAttackCount,
        removedBuffs: rotation.removedBuffCount,
      })),
    );

    if (affectedRotations.length === 0) {
      console.log('No orphaned attack or buff references were found.');
    }
  } finally {
    await sql.end();
  }
}

await main();
