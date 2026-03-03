import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import type { Capability } from '@/schemas/rotation';
import { useStore } from '@/store';

import { AttackCanvas } from './attack/AttackCanvas';
import { BuffCanvas } from './buff/BuffCanvas';
import { CapabilitySidebar } from './CapabilitySidebar';
import { TimelinePanWrapper } from './TimelinePanWrapper';

export const RotationBuilder = () => {
  const addAttack = useStore((state) => state.addAttack);
  const addBuff = useStore((state) => state.addBuff);

  // Attack drag and drop
  const {
    handleDragStart: handleDragAttack,
    createHandleDrop: createHandleDropAttack,
  } = useDragAndDrop<Capability>();

  const handleDropAttack = createHandleDropAttack((attack, item) => {
    addAttack(attack, item.x);
  });

  const handleAddAttack = (attack: Capability) => {
    addAttack(attack);
  };

  // Buff drag and drop
  const { handleDragStart: handleDragBuff, createHandleDrop: createHandleDropBuff } =
    useDragAndDrop<Capability>();

  const handleDropBuff = createHandleDropBuff((buff, item) => {
    addBuff(buff, {
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
    });
  });

  const handleAddBuff = (buff: Capability) => {
    addBuff(buff, { x: 0, y: 0, w: 2, h: 1 });
  };

  return (
    <div className="border-border flex h-full min-h-0 w-full overflow-hidden">
      <CapabilitySidebar
        onClickAttack={handleAddAttack}
        onDragAttack={handleDragAttack}
        onClickBuff={handleAddBuff}
        onDragBuff={handleDragBuff}
      />

      {/* Canvas Area */}
      <TimelinePanWrapper className="min-h-0 min-w-0 flex-1">
        <AttackCanvas onDropAttack={handleDropAttack} />
        <BuffCanvas onDropBuff={handleDropBuff} />
      </TimelinePanWrapper>
    </div>
  );
};
