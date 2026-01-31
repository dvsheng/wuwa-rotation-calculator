import { Palette } from '@/components/common/Palette';
import { PaletteItem } from '@/components/common/PaletteItem';
import { useTeamAttacks } from '@/hooks/useTeamAttacks';
import type { Capability } from '@/schemas/rotation';

export interface AttackPaletteProps {
  onAddAttack?: (attack: Capability) => void;
  onClickAttack?: (attack: Capability) => void;
  onDragAttack?: (attack: Capability, event: React.DragEvent) => void;
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

export const AttackPalette = ({
  onAddAttack,
  onClickAttack,
  onDragAttack,
  className,
}: AttackPaletteProps) => {
  const { attacks } = useTeamAttacks();
  const byCharacter = Object.groupBy(attacks, (a) => a.characterName);

  const groups = Object.entries(byCharacter).map(([charName, charAttacks]) => {
    const bySkill = Object.groupBy(charAttacks ?? [], (a) => a.parentName);
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
      getItemKey={(attack) => attack.id}
      emptyMessage="No attacks available"
      className={className}
      renderItem={(attack) => (
        <PaletteItem
          text={attack.name}
          hoverText={attack.description}
          onDragStart={onDragAttack ? (e) => onDragAttack(attack, e) : undefined}
          onAdd={onAddAttack ? () => onAddAttack(attack) : undefined}
          onClick={onClickAttack ? () => onClickAttack(attack) : undefined}
        />
      )}
    />
  );
};
