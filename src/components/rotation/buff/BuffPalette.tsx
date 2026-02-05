import { Palette } from '@/components/common/Palette';
import { PaletteItem } from '@/components/common/PaletteItem';
import { useTeamDetails } from '@/hooks/useTeamDetails';
import type { Capability } from '@/schemas/rotation';
import { Target } from '@/services/game-data/common-types';

export interface BuffPaletteProperties {
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
  onClickBuff,
  onDragBuff,
  className,
}: BuffPaletteProperties) => {
  const { buffs } = useTeamDetails();
  const byCharacter = Object.groupBy(buffs, (b) => b.characterName);

  const groups = Object.entries(byCharacter).map(([charName, charBuffs]) => {
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

  return (
    <Palette
      groups={groups}
      getItemKey={(buff) => buff.id}
      emptyMessage="No buffs available"
      className={className}
      isCollapsible={true}
      headerText="Buff Palette"
      headerContent={<TargetLegend />}
      renderItem={(buff) => (
        <PaletteItem
          text={buff.name}
          hoverText={buff.description}
          onDragStart={onDragBuff ? (event) => onDragBuff(buff, event) : undefined}
          onClick={onClickBuff ? () => onClickBuff(buff) : undefined}
          className={TARGET_COLORS[buff.target]}
        />
      )}
    />
  );
};

/**
 * Color classes for each modifier target type.
 */
const TARGET_COLORS: Record<string, string> = {
  [Target.SELF]: 'border-blue-400/60 bg-blue-500/10 text-blue-300',
  [Target.TEAM]: 'border-green-400/60 bg-green-500/10 text-green-300',
  [Target.ACTIVE_CHARACTER]: 'border-amber-400/60 bg-amber-500/10 text-amber-300',
  [Target.ENEMY]: 'border-red-400/60 bg-red-500/10 text-red-300',
};

const TARGET_LABELS: Record<string, string> = {
  [Target.SELF]: 'Self',
  [Target.TEAM]: 'Team',
  [Target.ACTIVE_CHARACTER]: 'Active',
  [Target.ENEMY]: 'Enemy',
};

/**
 * Legend component showing the color meaning for each target type.
 */
const TargetLegend = () => (
  <div className="flex flex-wrap gap-2 px-2 pb-2">
    {Object.entries(TARGET_LABELS).map(([target, label]) => (
      <div
        key={target}
        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-medium ${TARGET_COLORS[target]}`}
      >
        {label}
      </div>
    ))}
  </div>
);
