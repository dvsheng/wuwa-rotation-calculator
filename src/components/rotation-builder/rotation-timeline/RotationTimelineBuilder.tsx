import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Separator } from '@/components/ui/separator';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import type { Capability } from '@/schemas/rotation';
import { useStore } from '@/store';

import { AttackCanvas } from './attack/AttackCanvas';
import { BuffCanvas } from './buff/BuffCanvas';
import { CapabilitySidebar } from './CapabilitySidebar';
import { RotationCanvasHeader } from './RotationCanvasHeader';
import { TimelinePanWrapper } from './TimelinePanWrapper';

export const BUFF_LENGTH_ON_ADD = 6;

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
      w: BUFF_LENGTH_ON_ADD,
      h: item.h,
    });
  });

  const handleAddBuff = (buff: Capability) => {
    addBuff(buff, { x: 0, y: 0, w: BUFF_LENGTH_ON_ADD, h: 1 });
  };

  return (
    <ResizablePanelGroup orientation="horizontal">
      <ResizablePanel defaultSize="25%">
        <CapabilitySidebar
          onClickAttack={handleAddAttack}
          onDragAttack={handleDragAttack}
          onClickBuff={handleAddBuff}
          onDragBuff={handleDragBuff}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="75%" className="flex flex-col">
        <RotationCanvasHeader />
        <TimelinePanWrapper className="min-h-0 min-w-0 flex-1">
          <AttackCanvas onDropAttack={handleDropAttack} />
          <Separator></Separator>
          <BuffCanvas onDropBuff={handleDropBuff} />
        </TimelinePanWrapper>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
