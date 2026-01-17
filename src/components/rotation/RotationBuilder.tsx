import type { DragEndEvent } from '@dnd-kit/core';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Row, Stack } from '@/components/ui/layout';
import { Heading } from '@/components/ui/typography';
import { useRotationStore } from '@/store/useRotationStore';
import { useTeamStore } from '@/store/useTeamStore';

import { ROTATION_LIST_ROOT_ID, SIDEBAR_ORIGIN } from './constants';
import { RotationSidebar } from './sidebar/RotationSidebar';
import { RotationStepList } from './step-list/RotationStepList';
import { BuffTimeline } from './timeline/BuffTimeline';

/**
 * Parent Component: Manages state and layout for the Rotation Builder
 */
export const RotationBuilder = () => {
  const team = useTeamStore((state) => state.team);
  const attacks = useRotationStore((state) => state.attacks);
  const buffs = useRotationStore((state) => state.buffs);
  const addAttack = useRotationStore((state) => state.addAttack);
  const removeAttack = useRotationStore((state) => state.removeAttack);
  const reorderAttacks = useRotationStore((state) => state.reorderAttacks);
  const clearAll = useRotationStore((state) => state.clearAll);

  const [isDragging, setIsDragging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const addSidebarItem = (
    active: DragEndEvent['active'],
    over: DragEndEvent['over'],
  ) => {
    if (!over) return;
    const item = active.data.current?.item;
    const overIndex = attacks.findIndex((i) => i.id === over.id);

    const character = team.find((c) => c.name === item.characterName);

    addAttack(
      {
        ...item,
        characterId: character?.id || '',
      },
      overIndex,
    );
  };

  const reorderCanvasItem = (
    active: DragEndEvent['active'],
    over: DragEndEvent['over'],
  ) => {
    if (!over || active.id === over.id) return;

    if ([ROTATION_LIST_ROOT_ID, ROTATION_LIST_ROOT_ID].includes(over.id as string)) {
      const oldIndex = attacks.findIndex((i) => i.id === active.id);
      if (oldIndex !== -1) {
        reorderAttacks(oldIndex, attacks.length - 1);
      }
      return;
    }

    const oldIndex = attacks.findIndex((i) => i.id === active.id);
    const newIndex = attacks.findIndex((i) => i.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      reorderAttacks(oldIndex, newIndex);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragging(false);
    const { active, over } = event;
    if (!over) return;
    const activeData = active.data.current;
    if (activeData?.origin === SIDEBAR_ORIGIN) {
      addSidebarItem(active, over);
    } else {
      reorderCanvasItem(active, over);
    }
  };

  const handleAddItem = (item: any) => {
    const character = team.find((c) => c.name === item.characterName);
    addAttack({
      ...item,
      characterId: character?.id || '',
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      onDragStart={() => setIsDragging(true)}
      onDragCancel={() => setIsDragging(false)}
    >
      <Stack spacing="lg" className="h-[calc(100vh-140px)]">
        <Row className="items-center justify-between">
          <Heading level={2}>Rotation Builder</Heading>
          {(attacks.length > 0 || buffs.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              Clear All
            </Button>
          )}
        </Row>

        <BuffTimeline />

        <div className="flex flex-1 flex-col gap-6 overflow-hidden md:flex-row">
          <SortableContext
            items={attacks.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <RotationStepList items={attacks} onRemove={removeAttack} />
          </SortableContext>
          <RotationSidebar
            team={team}
            onSkillClick={handleAddItem}
            isDragging={isDragging}
          />
        </div>
      </Stack>
    </DndContext>
  );
};
