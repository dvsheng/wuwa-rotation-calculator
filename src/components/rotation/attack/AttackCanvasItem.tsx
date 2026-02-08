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

  return (
    <CanvasItem
      text={attack.name}
      subtext={attack.characterName}
      hoverText={attack.description}
      parameters={attack.parameters}
      index={index}
      onRemove={() => onRemove(attack.instanceId)}
      onSaveParameters={(parameters) =>
        updateAttackParameters(attack.instanceId, parameters)
      }
      centeredLayout
    />
  );
};
