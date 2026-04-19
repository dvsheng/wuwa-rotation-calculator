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

function toRawMontageRow(
  sourcePath: string,
  data: RawMontageAssetArray,
): NewRawMontage | undefined {
  const characterName = getCharacterName(sourcePath);
  const montage = data[0] as MontageRoot | undefined;
  if (!montage) return;
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
