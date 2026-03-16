import { DragDropProvider, DragOverlay } from '@dnd-kit/react';
import { toast } from 'sonner';

import { INITIAL_BUFF_LAYOUT } from '@/components/rotation-builder/rotation-timeline/constants';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { useRotationTimelineDnd } from '@/hooks/useRotationTimelineDnd';
import { CapabilityType } from '@/services/game-data';
import { useStore } from '@/store';
import type { TimelineDragData } from '@/types/dnd';

import { BaseAttackCanvasItem } from './attack/AttackCanvasItem';
import { BaseBuffCanvasItem } from './buff/BuffCanvasItem';
import { Canvas } from './Canvas';
import { CapabilitySidebar } from './CapabilitySidebar';
import { RotationCanvasHeader } from './RotationCanvasHeader';

export const RotationBuilder = () => {
  const addAttack = useStore((state) => state.addAttack);
  const attackCount = useStore((state) => state.attacks.length);
  const addBuff = useStore((state) => state.addBuff);
  const reorderAttacks = useStore((state) => state.reorderAttacks);
  const handleAddAttack = (
    attack: Parameters<typeof addAttack>[0],
    atIndex?: number,
  ) => {
    addAttack(attack, atIndex);
    toast.success('Attack added to the rotation timeline.');
  };
  const handleAddBuff = (
    buff: Parameters<typeof addBuff>[0],
    layout: Parameters<typeof addBuff>[1],
  ) => {
    addBuff(buff, layout);
    toast.success('Buff added to the alignment canvas.');
  };
  const {
    attackPreviewInsertIndex,
    buffPreviewLayout,
    handleDragEnd,
    handleDragMove,
    handleDragOver,
    handleDragStart,
  } = useRotationTimelineDnd({
    addAttack: handleAddAttack,
    addBuff: handleAddBuff,
    attackCount,
    onInvalidDrop: (reason) => {
      if (reason === 'attack-to-buff') {
        toast.error('Attacks can only be dropped on the attack timeline.');
        return;
      }

      toast.error('Buffs can only be dropped on the buff alignment canvas.');
    },
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
            onClickAttack={handleAddAttack}
            onClickBuff={(buff) => handleAddBuff(buff, INITIAL_BUFF_LAYOUT)}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="75%" className="flex h-full w-full flex-col">
          <RotationCanvasHeader />
          <Canvas
            attackPreviewInsertIndex={attackPreviewInsertIndex}
            buffPreviewLayout={buffPreviewLayout}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
      <DragOverlay
        className="pointer-events-none"
        dropAnimation={dragOverlayDropAnimation}
      >
        {(source) => {
          const { capability } = source.data;
          const CanvasItem =
            capability.capabilityType === CapabilityType.ATTACK
              ? BaseAttackCanvasItem
              : BaseBuffCanvasItem;
          return (
            <CanvasItem
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
