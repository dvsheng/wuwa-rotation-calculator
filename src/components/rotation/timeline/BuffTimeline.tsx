import type { DragEndEvent } from '@dnd-kit/core';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { GridLayoutProps } from 'react-grid-layout';
import { useContainerWidth } from 'react-grid-layout';

import { useRotationStore } from '@/store/useRotationStore';
import { useTeamStore } from '@/store/useTeamStore';

import { BUFF_ORIGIN, BUFF_TIMELINE_ID } from '../constants';

import { BuffSpace } from './BuffSpace';
import { CharacterBuffs } from './CharacterBuffs';
import { RotationTimeline } from './RotationTimeline';

export const BuffTimeline = () => {
  const team = useTeamStore((state) => state.team);
  const attacks = useRotationStore((state) => state.attacks);
  const buffs = useRotationStore((state) => state.buffs);
  const addBuff = useRotationStore((state) => state.addBuff);
  const removeBuff = useRotationStore((state) => state.removeBuff);
  const updateBuffLayout = useRotationStore((state) => state.updateBuffLayout);
  const updateBuffParameter = useRotationStore((state) => state.updateBuffParameter);

  const { width, containerRef, mounted } = useContainerWidth();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;
    if (!over || over.id !== BUFF_TIMELINE_ID) return;

    const activeData = active.data.current;
    if (activeData?.origin === BUFF_ORIGIN) {
      const buff = activeData.item;
      const droppableRect = over.rect;
      const mouseX =
        event.activatorEvent instanceof MouseEvent
          ? event.activatorEvent.clientX + delta.x
          : 0;

      const relativeX = mouseX - droppableRect.left;
      const maxItems = Math.max(attacks.length, 5);
      const colWidth = droppableRect.width / maxItems;
      const snappedX = Math.max(
        0,
        Math.min(maxItems - 1, Math.floor(relativeX / colWidth)),
      );

      const character = team.find((c) => c.name === buff.characterName);

      addBuff({
        ...buff,
        characterId: character?.id || '',
        x: snappedX,
        y: 0,
        w: 1,
        h: 1,
        parameterValue: undefined,
      });
    }
  };

  const commonGridProps: Omit<GridLayoutProps, 'children'> = {
    width: width,
    gridConfig: {
      cols: Math.max(attacks.length, 5),
      rowHeight: 20,
      margin: [2, 2],
      containerPadding: [0, 0],
      maxRows: Infinity,
    },
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div ref={containerRef} className="flex w-full flex-col gap-2">
        {mounted && (
          <>
            <RotationTimeline items={attacks} layoutProps={commonGridProps} />

            <BuffSpace
              activeBuffs={buffs}
              layoutProps={commonGridProps}
              onRemove={removeBuff}
              onLayoutChange={(layout) => {
                layout.forEach((l) => {
                  updateBuffLayout(l.i, { x: l.x, y: l.y, w: l.w, h: l.h });
                });
              }}
              onSave={updateBuffParameter}
            />

            <CharacterBuffs team={team} />
          </>
        )}
      </div>
    </DndContext>
  );
};
