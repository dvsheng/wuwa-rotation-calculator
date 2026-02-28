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
import type { DetailedAttack } from '@/hooks/useTeamDetails';
import { useTeamDetails } from '@/hooks/useTeamDetails';
import type { Capability } from '@/schemas/rotation';
import { OriginType } from '@/services/game-data';
import type { AttackOriginType } from '@/services/game-data';
import { TUNE_BREAK_ATTACK_ID } from '@/services/rotation-calculator/tune-break';

export interface AttackPaletteProperties {
  onClickAttack?: (attack: Capability) => void;
  onDragAttack?: (attack: Capability, event: React.DragEvent<HTMLElement>) => void;
  className?: string;
}

const TUNE_BREAK_CAPABILITY: DetailedAttack = {
  id: TUNE_BREAK_ATTACK_ID,
  characterId: 0,
  characterName: 'All Characters',
  name: 'Tune Break',
  parentName: 'Other',
  originType: OriginType.TUNE_BREAK,
};

export const AttackPalette = ({
  onClickAttack,
  onDragAttack,
  className,
}: AttackPaletteProperties) => {
  const { attacks } = useTeamDetails();
  const hasTuneBreak = attacks.some((a) => a.originType === OriginType.TUNE_BREAK);
  const nonTuneBreakAttacks = attacks.filter(
    (a) => a.originType !== OriginType.TUNE_BREAK,
  );
  const byCharacter = Object.groupBy(nonTuneBreakAttacks, (a) => a.characterName);

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

      {hasTuneBreak && (
        <PaletteGroup name="Other">
          <PaletteItem
            text="Tune Break"
            capability={TUNE_BREAK_CAPABILITY}
            legendLabel={OriginType.TUNE_BREAK}
            onDragStart={
              onDragAttack
                ? (event) => onDragAttack(TUNE_BREAK_CAPABILITY, event)
                : undefined
            }
            onClick={
              onClickAttack ? () => onClickAttack(TUNE_BREAK_CAPABILITY) : undefined
            }
            className={SKILL_COLORS[OriginType.TUNE_BREAK]}
          />
        </PaletteGroup>
      )}
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
