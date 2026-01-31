import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import type { Capability } from '@/schemas/rotation';
import { CapabilitySchema } from '@/schemas/rotation';
import { useRotationStore } from '@/store/useRotationStore';

import { BuffCanvas } from './BuffCanvas';
import { BuffPalette } from './BuffPalette';

export const BuffTimelineBuilder = () => {
  const addBuff = useRotationStore((state) => state.addBuff);
  const { handleDragStart, createHandleDrop } = useDragAndDrop({
    schema: CapabilitySchema,
  });

  const handleDropBuff = createHandleDrop((buff, item) => {
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
    <>
      <BuffCanvas onDropBuff={handleDropBuff} />
      <BuffPalette onClickBuff={handleAddBuff} onDragBuff={handleDragStart} />
    </>
  );
};
