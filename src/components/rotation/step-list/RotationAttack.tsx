import type { Attack } from '@/schemas/rotation';
import { useRotationStore } from '@/store/useRotationStore';
import type { DetailedAttack } from '@/types/client/capability';

import { CanvasItem } from '../../common/CanvasItem';

interface RotationAttackProps {
  attack: DetailedAttack & Attack;
  index: number;
  onRemove: (instanceId: string) => void;
}

export const RotationAttack = ({ attack, index, onRemove }: RotationAttackProps) => {
  const updateAttackParameters = useRotationStore(
    (state) => state.updateAttackParameters,
  );
  const displayName = `${attack.parentName}: ${attack.name}`;

  const parameters = attack.parameters?.map((parameter, i) => ({
    ...parameter,
    value: attack.parameterValues?.[i] ?? parameter.minimum,
  }));

  return (
    <CanvasItem
      text={displayName}
      subtext={attack.characterName}
      hoverText={attack.description}
      parameters={parameters}
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
