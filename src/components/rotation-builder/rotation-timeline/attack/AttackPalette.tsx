import {
  Palette,
  PaletteGroup,
  PaletteItem,
  PaletteLegend,
} from '@/components/common/Palette';
import {
  ATTACK_SKILL_ORDER,
  sortAttackOrigins,
} from '@/components/rotation-builder/constants';
import { useTeamDetails } from '@/hooks/useTeamDetails';
import type { Capability } from '@/schemas/rotation';
import type { AttackOriginType } from '@/services/game-data';

export interface AttackPaletteProperties {
  onClickAttack?: (attack: Capability) => void;
  onDragAttack?: (attack: Capability, event: React.DragEvent<HTMLElement>) => void;
  className?: string;
}

export const AttackPalette = ({
  onClickAttack,
  onDragAttack,
  className,
}: AttackPaletteProperties) => {
  const { attacks } = useTeamDetails();
  const byCharacter = Object.groupBy(attacks, (a) => a.characterName);

  const legend = ATTACK_SKILL_ORDER.map((skill) => ({
    label: skill,
    className: SKILL_COLORS[skill],
  }));

  return (
    <Palette
      emptyMessage="No attacks available"
      className={className}
      headerText="Attacks"
    >
      <PaletteLegend items={legend} />

      {Object.entries(byCharacter).map(([charName, charAttacks]) => {
        const bySkill = Object.groupBy(charAttacks ?? [], (a) => a.originType);
        const orderedSkills = (
          Object.keys(bySkill) as Array<AttackOriginType>
        ).toSorted(sortAttackOrigins);

        const allAttacks = orderedSkills.flatMap(
          (skillName) => bySkill[skillName] ?? [],
        );

        return (
          <PaletteGroup key={charName} name={charName}>
            {allAttacks.map((attack) => (
              <PaletteItem
                key={attack.id}
                text={attack.name}
                capability={attack}
                legendLabel={attack.originType}
                onDragStart={
                  onDragAttack ? (event) => onDragAttack(attack, event) : undefined
                }
                onClick={onClickAttack ? () => onClickAttack(attack) : undefined}
                className={SKILL_COLORS[attack.originType]}
              />
            ))}
          </PaletteGroup>
        );
      })}
    </Palette>
  );
};

/**
 * Color classes for each skill type.
 */
const SKILL_COLORS: Record<AttackOriginType, string> = {
  'Normal Attack': 'border-slate-400 bg-slate-100 text-foreground',
  'Resonance Skill': 'border-sky-400 bg-sky-100 text-foreground',
  'Resonance Liberation': 'border-violet-400 bg-violet-100 text-foreground',
  'Forte Circuit': 'border-amber-400 bg-amber-100 text-foreground',
  'Intro Skill': 'border-lime-400 bg-lime-100 text-foreground',
  'Outro Skill': 'border-emerald-400 bg-emerald-100 text-foreground',
  'Tune Break': 'border-cyan-400 bg-cyan-100 text-foreground',
  Echo: 'border-orange-400 bg-orange-100 text-foreground',
  Weapon: 'border-indigo-400 bg-indigo-100 text-foreground',
  'Echo Set': 'border-fuchsia-400 bg-fuchsia-100 text-foreground',
  s1: 'border-yellow-400 bg-yellow-100 text-foreground',
  s2: 'border-yellow-400 bg-yellow-100 text-foreground',
  s3: 'border-yellow-400 bg-yellow-100 text-foreground',
  s4: 'border-yellow-400 bg-yellow-100 text-foreground',
  s5: 'border-yellow-400 bg-yellow-100 text-foreground',
  s6: 'border-yellow-400 bg-yellow-100 text-foreground',
};
