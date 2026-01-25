import type { Attack } from '@/schemas/rotation';
import { useRotationStore } from '@/store/useRotationStore';

import { CanvasItem } from '../../common/CanvasItem';

interface RotationAttackProps {
  attack: Attack;
  index: number;
  onRemove: (id: string) => void;
}

export const RotationAttack = ({ attack, index, onRemove }: RotationAttackProps) => {
  const updateAttackParameters = useRotationStore(
    (state) => state.updateAttackParameters,
  );

  const displayName = attack.parentName
    ? `${attack.parentName}: ${attack.name}`
    : attack.name;

  return (
    <CanvasItem
      text={displayName}
      subtext={attack.characterName}
      hoverText={attack.description}
      parameters={attack.parameters}
      index={index}
      onRemove={() => onRemove(attack.id)}
      onSaveParameters={(vals) => updateAttackParameters(attack.id, vals)}
    />
  );
};
