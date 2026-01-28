import { useMemo } from 'react';

import { Palette } from '@/components/common/Palette';
import type { PaletteGroup } from '@/components/common/Palette';
import { PaletteItem } from '@/components/common/PaletteItem';
import type { Capability } from '@/schemas/rotation';

export interface BuffPaletteProps {
  buffs: Array<Capability>;
  onClickBuff?: (buff: Capability) => void;
  onDragBuff?: (buff: Capability, event: React.DragEvent) => void;
  className?: string;
}

const SKILL_ORDER = [
  'Basic Attack',
  'Resonance Skill',
  'Resonance Liberation',
  'Forte Circuit',
  'Intro Skill',
  'Outro Skill',
] as const;

export const BuffPalette = ({
  buffs,
  onClickBuff,
  onDragBuff,
  className,
}: BuffPaletteProps) => {
  const groups = useMemo((): Array<PaletteGroup<Capability>> => {
    const byCharacter = Object.groupBy(buffs, (b) => b.characterName);

    return Object.entries(byCharacter).map(([charName, charBuffs]) => {
      const bySkill = Object.groupBy(charBuffs ?? [], (b) => b.parentName);

      // Get ordered skills first, then any remaining skills not in the order
      const orderedSkills = SKILL_ORDER.filter((skill) => bySkill[skill]?.length);
      const remainingSkills = Object.keys(bySkill).filter(
        (skill) => !SKILL_ORDER.includes(skill as (typeof SKILL_ORDER)[number]),
      );

      return {
        name: charName,
        subgroups: [...orderedSkills, ...remainingSkills].map((skillName) => ({
          name: skillName,
          items: bySkill[skillName] ?? [],
        })),
      };
    });
  }, [buffs]);

  return (
    <Palette
      groups={groups}
      getItemKey={(buff) => buff.id}
      emptyMessage="No buffs available"
      className={className}
      renderItem={(buff) => (
        <PaletteItem
          text={buff.name}
          hoverText={buff.description}
          onDragStart={onDragBuff ? (e) => onDragBuff(buff, e) : undefined}
          onClick={onClickBuff ? () => onClickBuff(buff) : undefined}
        />
      )}
    />
  );
};
