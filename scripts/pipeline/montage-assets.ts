import path from 'node:path';

import type {
  NewRawMontage,
  NewRawReBulletDataMainRow,
  NewRawSkillInfoRow,
  RawReBulletDataRow,
} from '../../src/db/raw-schema';

import type {
  MontageNotifyDetails,
  MontageRoot,
  RawMontageAssetArray,
  RawReBulletDataMainFileArray,
  RawSkillInfoRowDataFileArray,
} from './github-data.schemas';

function getCharacterPath(sourcePath: string) {
  return path.posix.dirname(path.posix.dirname(sourcePath));
}

function getCharacterName(sourcePath: string) {
  return path.posix.basename(getCharacterPath(sourcePath));
}

function getMontageCharacterName(
  sourcePath: string,
  characterNameOverride: string | undefined,
): string | undefined {
  if (!sourcePath.startsWith('Vision/')) {
    return getCharacterName(sourcePath);
  }

  if (characterNameOverride) {
    return characterNameOverride;
  }

  console.warn(
    `Skipping ${sourcePath}: unable to derive echo character name from echo bullet ids`,
  );
}

function toRawMontageRow(
  sourcePath: string,
  data: RawMontageAssetArray,
  characterNameOverride?: string,
): NewRawMontage | undefined {
  const montage = data[0] as MontageRoot | undefined;
  if (!montage) return;

  const characterName = getMontageCharacterName(sourcePath, characterNameOverride);
  if (!characterName) return;

  return {
    name: montage.Name,
    characterName,
    data: montage,
    notifyDetails: data.slice(1) as Array<MontageNotifyDetails>,
  };
}

function toRawSkillInfoRows(
  data: RawSkillInfoRowDataFileArray,
): Array<NewRawSkillInfoRow> {
  const rows = data[0].Rows;

  return Object.entries(rows).flatMap(([skillId, rowData]) => {
    const parsedSkillId = Number.parseInt(skillId);
    if (Number.isNaN(parsedSkillId)) {
      return [];
    }

    return [
      {
        skillId: parsedSkillId,
        rowData,
      },
    ];
  });
}

function toRawReBulletDataMainRows(
  _sourcePath: string,
  data: RawReBulletDataMainFileArray,
): Array<NewRawReBulletDataMainRow> {
  const rows = data[0].Rows;

  return Object.entries(rows).flatMap(([bulletId, rowData]) => {
    const parsedBulletId = Number.parseInt(bulletId);
    if (Number.isNaN(parsedBulletId)) {
      return [];
    }
    return [
      {
        bulletId: parsedBulletId,
        rowData: rowData as RawReBulletDataRow,
      },
    ];
  });
}

export { toRawMontageRow, toRawReBulletDataMainRows, toRawSkillInfoRows };
