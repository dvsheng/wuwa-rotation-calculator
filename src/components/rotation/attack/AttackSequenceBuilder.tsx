import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import type { Capability } from '@/schemas/rotation';
import { CapabilitySchema } from '@/schemas/rotation';
import { useRotationStore } from '@/store/useRotationStore';

import { AttackCanvas } from './AttackCanvas';
import { AttackPalette } from './AttackPalette';

export const AttackSequenceBuilder = () => {
  const addAttack = useRotationStore((state) => state.addAttack);
  const { handleDragStart: handleDragAttack, createHandleDrop } = useDragAndDrop({
    schema: CapabilitySchema,
  });

  const handleDropAttack = createHandleDrop((attack, item) => {
    addAttack(attack, item.x);
  });

  const handleAddAttack = (attack: Capability) => {
    addAttack(attack);
  };

  return (
    <>
      <AttackPalette onClickAttack={handleAddAttack} onDragAttack={handleDragAttack} />
      <AttackCanvas onDropAttack={handleDropAttack} />
    </>
  );
};
