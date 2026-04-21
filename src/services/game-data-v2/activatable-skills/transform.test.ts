import { describe, expect, it } from 'vitest';

import type { SkillInfoRow } from '../repostiory';

import { transform } from './transform';

describe('activatable skill transform', () => {
  it('uses the echo skill id prefix for Vision montage ids', () => {
    const skill = transform(
      createSkillInfoRow({
        skillId: 280_029_010,
        animationPath:
          '/Game/Aki/Character/Vision/VM_Boss/VM_MB1Hecate/Md00601/CommonAnim/AM_Skill01.AM_Skill01',
      }),
    );

    expect(skill.montages).toEqual(['AM_Skill01-280029']);
  });

  it('uses the character folder for Role montage ids', () => {
    const skill = transform(
      createSkillInfoRow({
        skillId: 1_402_101,
        animationPath:
          '/Game/Aki/Character/Role/Blue/Chixia/CommonAnim/AM_Attack01.AM_Attack01',
      }),
    );

    expect(skill.montages).toEqual(['AM_Attack01-Chixia']);
  });
});

const createSkillInfoRow = ({
  skillId,
  animationPath,
}: {
  skillId: number;
  animationPath: string;
}): SkillInfoRow => {
  const row = {
    skillId,
    rowData: {
      SkillName: 'Test Skill',
      SkillGenre: 'Genre1',
      Animations: [{ AssetPathName: animationPath, SubPathString: '' }],
      SkillStartBuff: [],
      SkillEndBuff: [],
      SkillBuff: [],
      SkillTag: [],
      GroupId: 1,
      ToughRatio: 1,
    },
  };

  return row as unknown as SkillInfoRow;
};
