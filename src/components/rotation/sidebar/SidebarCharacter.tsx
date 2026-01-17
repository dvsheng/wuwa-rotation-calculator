import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/typography';
import { useCharacterDetails } from '@/hooks/useCharacterDetails';
import { OriginType } from '@/services/game-data/character/types';

import type { RotationItem } from '../types';

import { SidebarSkillGroup } from './SidebarSkillGroup';

interface SidebarCharacterProps {
  name: string;
  onSkillClick: (item: Omit<RotationItem, 'id'>) => void;
  isDragging: boolean;
}

const GROUP_ORDER: Record<string, number> = {
  [OriginType.NORMAL_ATTACK]: 1,
  [OriginType.RESONANCE_SKILL]: 2,
  [OriginType.RESONANCE_LIBERATION]: 3,
  [OriginType.FORTE_CIRCUIT]: 4,
  [OriginType.INTRO_SKILL]: 5,
  [OriginType.OUTRO_SKILL]: 6,
  [OriginType.INHERENT_SKILL]: 7,
  [OriginType.S1]: 8,
  [OriginType.S2]: 9,
  [OriginType.S3]: 10,
  [OriginType.S4]: 11,
  [OriginType.S5]: 12,
  [OriginType.S6]: 13,
};

export const SidebarCharacter = ({
  name,
  onSkillClick,
  isDragging,
}: SidebarCharacterProps) => {
  const { data, isLoading, error } = useCharacterDetails(name);
  if (isLoading)
    return (
      <Text variant="muted" className="p-2">
        Loading {name}...
      </Text>
    );
  if (error || !data) return null;
  const { attacks } = data;

  const groups = Map.groupBy(attacks, (attack) => {
    return attack.parentName;
  });

  const sortedGroups = Array.from(groups.entries()).sort(([, aSkills], [, bSkills]) => {
    const aOrder = GROUP_ORDER[aSkills[0]?.originType] ?? 99;
    const bOrder = GROUP_ORDER[bSkills[0]?.originType] ?? 99;
    return aOrder - bOrder;
  });

  return (
    <div className="min-w-0 space-y-4 p-2">
      <div className="flex items-center justify-between px-1">
        <Text variant="small" className="font-bold">
          {data.name}
        </Text>
      </div>

      <div className="min-w-0 space-y-4">
        {sortedGroups.map(([groupKey, skills]) => {
          if (skills.length === 0) return null;
          const first = skills[0];
          const items = skills.map((skill) => ({
            id: `${data.name}-${skill.parentName}-${skill.name}`,
            characterId: data.id,
            characterName: data.name,
            skillName: skill.parentName,
            damageInstanceName: skill.name,
            originType: skill.originType,
            description: skill.description,
          }));

          return (
            <SidebarSkillGroup
              key={groupKey}
              skillName={first.parentName}
              originType={first.originType}
              items={items}
              onSkillClick={onSkillClick}
              isDragging={isDragging}
            />
          );
        })}

        {attacks.length === 0 && (
          <Text variant="muted" className="px-1 text-[10px] italic">
            No damage skills
          </Text>
        )}
      </div>
      <Separator className="mt-4" />
    </div>
  );
};
