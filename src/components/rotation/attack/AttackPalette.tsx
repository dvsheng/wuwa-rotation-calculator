import { Palette } from '@/components/common/Palette';
import { PaletteItem } from '@/components/common/PaletteItem';
import { useTeamDetails } from '@/hooks/useTeamDetails';
import type { Capability } from '@/schemas/rotation';
import type { AttackOriginType } from '@/services/game-data/common-types';

export interface AttackPaletteProperties {
  onAddAttack?: (attack: Capability) => void;
  onClickAttack?: (attack: Capability) => void;
  onDragAttack?: (attack: Capability, event: React.DragEvent) => void;
  className?: string;
}

const SKILL_ORDER: Array<AttackOriginType> = [
  'Normal Attack',
  'Resonance Skill',
  'Resonance Liberation',
  'Forte Circuit',
  'Intro Skill',
  'Outro Skill',
  'Tune Break',
  'Echo',
  'Weapon',
];

export const AttackPalette = ({
  onAddAttack,
  onClickAttack,
  onDragAttack,
  className,
}: AttackPaletteProperties) => {
  const { attacks } = useTeamDetails();
  const byCharacter = Object.groupBy(attacks, (a) => a.characterName);

  const groups = Object.entries(byCharacter).map(([charName, charAttacks]) => {
    const bySkill = Object.groupBy(charAttacks ?? [], (a) => a.originType);
    // Get ordered skills first, then any remaining skills not in the order
    const orderedSkills = SKILL_ORDER.filter((skill) => bySkill[skill]?.length);
    const remainingSkills = (Object.keys(bySkill) as Array<AttackOriginType>).filter(
      (skill) => !SKILL_ORDER.includes(skill),
    );
    return {
      name: charName,
      subgroups: [...orderedSkills, ...remainingSkills].map((skillName) => ({
        name: skillName,
        items: bySkill[skillName] ?? [],
      })),
    };
  });

  const legend = SKILL_ORDER.map((skill) => ({
    label: skill,
    className: SKILL_COLORS[skill],
  }));

  return (
    <Palette
      groups={groups}
      getItemKey={(attack) => String(attack.id)}
      getItemLegendLabel={(attack) => attack.originType}
      emptyMessage="No attacks available"
      className={className}
      isCollapsible={true}
      headerText="Attack Palette"
      legend={legend}
      renderItem={(attack) => (
        <PaletteItem
          text={attack.name}
          hoverText={attack.description}
          onDragStart={
            onDragAttack ? (event) => onDragAttack(attack, event) : undefined
          }
          onAdd={onAddAttack ? () => onAddAttack(attack) : undefined}
          onClick={onClickAttack ? () => onClickAttack(attack) : undefined}
          className={SKILL_COLORS[attack.originType]}
        />
      )}
    />
  );
};

/**
 * Color classes for each skill type.
 */
const SKILL_COLORS: Record<AttackOriginType, string> = {
  'Normal Attack': 'border-slate-400 bg-slate-100 text-black',
  'Resonance Skill': 'border-sky-400 bg-sky-100 text-black',
  'Resonance Liberation': 'border-violet-400 bg-violet-100 text-black',
  'Forte Circuit': 'border-amber-400 bg-amber-100 text-black',
  'Intro Skill': 'border-lime-400 bg-lime-100 text-black',
  'Outro Skill': 'border-emerald-400 bg-emerald-100 text-black',
  'Tune Break': 'border-cyan-400 bg-cyan-100 text-black',
  Echo: 'border-orange-400 bg-orange-100 text-black',
  Weapon: 'border-indigo-400 bg-indigo-100 text-black',
  'Echo Set': 'border-fuchsia-400 bg-fuchsia-100 text-black',
  s1: 'border-yellow-400 bg-yellow-100 text-black',
  s2: 'border-yellow-400 bg-yellow-100 text-black',
  s3: 'border-yellow-400 bg-yellow-100 text-black',
  s4: 'border-yellow-400 bg-yellow-100 text-black',
  s5: 'border-yellow-400 bg-yellow-100 text-black',
  s6: 'border-yellow-400 bg-yellow-100 text-black',
};
