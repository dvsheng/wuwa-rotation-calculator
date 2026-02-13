import {
  Palette,
  PaletteGroup,
  PaletteItem,
  PaletteLegend,
} from '@/components/common/Palette';
import { useTeamDetails } from '@/hooks/useTeamDetails';
import type { Capability } from '@/schemas/rotation';
import type { OriginType } from '@/services/game-data/types';
import { Target } from '@/services/game-data/types';

export interface BuffPaletteProperties {
  onClickBuff?: (buff: Capability) => void;
  onDragBuff?: (buff: Capability, event: React.DragEvent) => void;
  className?: string;
}

const SKILL_ORDER: Array<OriginType> = [
  'Normal Attack',
  'Resonance Skill',
  'Resonance Liberation',
  'Forte Circuit',
  'Intro Skill',
  'Outro Skill',
  'Inherent Skill',
  'Tune Break',
  'Echo',
  'Weapon',
  'Echo Set',
];

export const BuffPalette = ({
  onClickBuff,
  onDragBuff,
  className,
}: BuffPaletteProperties) => {
  const { buffs } = useTeamDetails();
  const byCharacter = Object.groupBy(buffs, (b) => b.characterName);

  const legend = Object.entries(TARGET_LABELS).map(([target, label]) => ({
    label,
    className: TARGET_COLORS[target as Target],
  }));

  return (
    <Palette
      emptyMessage="No buffs available"
      className={className}
      isCollapsible={true}
      headerText="Buff Palette"
    >
      <PaletteLegend items={legend} />

      {Object.entries(byCharacter).map(([charName, charBuffs]) => {
        const bySkill = Object.groupBy(charBuffs ?? [], (b) => b.originType);

        // Get ordered skills first, then any remaining skills not in the order
        const orderedSkills = SKILL_ORDER.filter((skill) => bySkill[skill]?.length);
        const remainingSkills = (Object.keys(bySkill) as Array<OriginType>).filter(
          (skill) => !SKILL_ORDER.includes(skill),
        );

        const allBuffs = [...orderedSkills, ...remainingSkills].flatMap(
          (skillName) => bySkill[skillName] ?? [],
        );

        return (
          <PaletteGroup key={charName} name={charName}>
            {allBuffs.map((buff) => (
              <PaletteItem
                key={buff.id}
                text={buff.name}
                hoverText={buff.description}
                legendLabel={TARGET_LABELS[buff.target]}
                onDragStart={
                  onDragBuff ? (event) => onDragBuff(buff, event) : undefined
                }
                onClick={onClickBuff ? () => onClickBuff(buff) : undefined}
                className={TARGET_COLORS[buff.target]}
              />
            ))}
          </PaletteGroup>
        );
      })}
    </Palette>
  );
};

/**
 * Color classes for each modifier target type.
 */
export const TARGET_COLORS: Record<Target, string> = {
  [Target.SELF]: 'border-blue-400 bg-blue-100 text-black',
  [Target.TEAM]: 'border-green-400 bg-green-100 text-black',
  [Target.ACTIVE_CHARACTER]: 'border-amber-400 bg-amber-100 text-black',
  [Target.ENEMY]: 'border-red-400 bg-red-100 text-black',
};

const TARGET_LABELS: Record<Target, string> = {
  [Target.SELF]: 'Self',
  [Target.TEAM]: 'Team',
  [Target.ACTIVE_CHARACTER]: 'Active',
  [Target.ENEMY]: 'Enemy',
};
