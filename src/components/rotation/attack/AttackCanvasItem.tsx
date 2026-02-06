import type { DetailedAttackInstance } from '@/hooks/useTeamAttackInstances';
import { useRotationStore } from '@/store/useRotationStore';

import { CanvasItem } from '../../common/CanvasItem';

interface AttackCanvasItemProperties {
  attack: DetailedAttackInstance;
  index: number;
  onRemove: (instanceId: string) => void;
}

export const AttackCanvasItem = ({
  attack,
  index,
  onRemove,
}: AttackCanvasItemProperties) => {
  const updateAttackParameters = useRotationStore(
    (state) => state.updateAttackParameters,
  );
  const displayName = `${attack.parentName}: ${attack.name}`;

  return (
    <CanvasItem
      text={displayName}
      subtext={attack.characterName}
      hoverText={attack.description}
      parameters={attack.parameters}
      index={index}
      onRemove={() => onRemove(attack.instanceId)}
      onSaveParameters={(vals) =>
        updateAttackParameters(
          attack.instanceId,
          vals.map((v) => v ?? 0),
        )
      }
    />
  );
};
