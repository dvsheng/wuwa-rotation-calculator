import {
  Palette,
  PaletteGroup,
  PaletteItem,
  PaletteLegend,
} from '@/components/common/Palette';
import type { DetailedModifier } from '@/hooks/useTeamDetails';
import { useTeamDetails } from '@/hooks/useTeamDetails';
import type { Capability } from '@/schemas/rotation';
import type { OriginType } from '@/services/game-data';
import { Target } from '@/services/game-data';
import { TUNE_STRAIN_BUFF_ID } from '@/services/game-data/tune-strain';

export interface BuffPaletteProperties {
  onClickBuff?: (buff: Capability) => void;
  onDragBuff?: (buff: Capability, event: React.DragEvent<HTMLElement>) => void;
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

const TARGET_ORDER: Array<Target> = [
  Target.SELF,
  Target.TEAM,
  Target.ACTIVE_CHARACTER,
  Target.ENEMY,
];

const TUNE_STRAIN_CAPABILITY: DetailedModifier = {
  id: TUNE_STRAIN_BUFF_ID,
  characterId: 0,
  entityId: 0,
  characterName: 'All Characters',
  name: 'Tune Strain',
  parentName: 'Other',
  originType: 'Tune Break',
  target: Target.ENEMY,
  parameters: [{ id: '0', minimum: 0, maximum: 4 }],
};

export const BuffPalette = ({
  onClickBuff,
  onDragBuff,
  className,
}: BuffPaletteProperties) => {
  const { buffs, hasTuneStrain } = useTeamDetails();
  const byCharacter = Object.groupBy(buffs, (b) => b.characterName);

  const legend = Object.entries(TARGET_LABELS).map(([target, label]) => ({
    label,
    className: TARGET_COLORS[target as Target],
  }));

  return (
    <Palette emptyMessage="No buffs available" className={className} headerText="Buffs">
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
        const sortedBuffs = allBuffs.toSorted(
          (a, b) => TARGET_ORDER.indexOf(a.target) - TARGET_ORDER.indexOf(b.target),
        );

        return (
          <PaletteGroup key={charName} name={charName}>
            {sortedBuffs.map((buff) => (
              <PaletteItem
                key={buff.id}
                text={buff.name}
                capability={buff}
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

      {hasTuneStrain && (
        <PaletteGroup name="Other">
          <PaletteItem
            text="Tune Strain"
            capability={TUNE_STRAIN_CAPABILITY}
            legendLabel={TARGET_LABELS[Target.ENEMY]}
            onDragStart={
              onDragBuff
                ? (event) => onDragBuff(TUNE_STRAIN_CAPABILITY, event)
                : undefined
            }
            onClick={
              onClickBuff ? () => onClickBuff(TUNE_STRAIN_CAPABILITY) : undefined
            }
            className={TARGET_COLORS[Target.ENEMY]}
          />
        </PaletteGroup>
      )}
    </Palette>
  );
};

/**
 * Color classes for each modifier target type.
 */
export const TARGET_COLORS: Record<Target, string> = {
  [Target.SELF]: 'border-blue-400 bg-blue-100 text-foreground',
  [Target.TEAM]: 'border-green-400 bg-green-100 text-foreground',
  [Target.ACTIVE_CHARACTER]: 'border-amber-400 bg-amber-100 text-foreground',
  [Target.ENEMY]: 'border-red-400 bg-red-100 text-foreground',
};

const TARGET_LABELS: Record<Target, string> = {
  [Target.SELF]: 'Self',
  [Target.TEAM]: 'Team',
  [Target.ACTIVE_CHARACTER]: 'Active',
  [Target.ENEMY]: 'Enemy',
};
