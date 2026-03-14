import { DragDropProvider, DragOverlay } from '@dnd-kit/react';

import { INITIAL_BUFF_LAYOUT } from '@/components/rotation-builder/rotation-timeline/constants';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Separator } from '@/components/ui/separator';
import { useRotationTimelineDnd } from '@/hooks/useRotationTimelineDnd';
import { CapabilityType } from '@/services/game-data';
import { useStore } from '@/store';
import type { TimelineDragData } from '@/types/dnd';

import { AttackCanvas } from './attack/AttackCanvas';
import { BaseAttackCanvasItem } from './attack/AttackCanvasItem';
import { BuffCanvas } from './buff/BuffCanvas';
import { BaseBuffCanvasItem } from './buff/BuffCanvasItem';
import { CapabilitySidebar } from './CapabilitySidebar';
import { RotationCanvasHeader } from './RotationCanvasHeader';
import { TimelinePanWrapper } from './TimelinePanWrapper';

export const RotationBuilder = () => {
  const addAttack = useStore((state) => state.addAttack);
  const attackCount = useStore((state) => state.attacks.length);
  const addBuff = useStore((state) => state.addBuff);
  const reorderAttacks = useStore((state) => state.reorderAttacks);
  const {
    attackPreviewInsertIndex,
    buffPreviewLayout,
    handleDragEnd,
    handleDragMove,
    handleDragOver,
    handleDragStart,
  } = useRotationTimelineDnd({
    addAttack,
    addBuff,
    attackCount,
    reorderAttacks,
  });

  // dnd-kit uses `null` to disable drop animation entirely; `undefined` would
  // opt back into the library's default drop animation, so we intentionally
  // preserve the runtime distinction here.
  // @ts-ignore The DragOverlay prop type does not model `null`, but dnd-kit
  // uses `null` to disable the animation entirely at runtime. `undefined`
  // would opt back into the default drop animation instead.
  // eslint-disable-next-line unicorn/no-null
  const dragOverlayDropAnimation = null;
  return (
    <DragDropProvider<TimelineDragData>
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel defaultSize="25%">
          <CapabilitySidebar
            onClickAttack={addAttack}
            onClickBuff={(buff) => addBuff(buff, INITIAL_BUFF_LAYOUT)}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="75%" className="flex flex-col">
          <RotationCanvasHeader />
          <TimelinePanWrapper className="min-h-0 min-w-0 flex-1">
            <AttackCanvas previewInsertIndex={attackPreviewInsertIndex} />
            <Separator />
            <BuffCanvas previewLayout={buffPreviewLayout} />
          </TimelinePanWrapper>
        </ResizablePanel>
      </ResizablePanelGroup>
      <DragOverlay
        className="pointer-events-none"
        dropAnimation={dragOverlayDropAnimation}
      >
        {(source) => {
          const { capability } = source.data;
          if (capability.capabilityType === CapabilityType.ATTACK) {
            return (
              <BaseAttackCanvasItem
                name={capability.name}
                iconUrl={capability.iconUrl}
                characterIconUrl={capability.characterIconUrl}
              />
            );
          }
          return (
            <BaseBuffCanvasItem
              name={capability.name}
              iconUrl={capability.iconUrl}
              characterIconUrl={capability.characterIconUrl}
            />
          );
        }}
      </DragOverlay>
    </DragDropProvider>
  );
};
