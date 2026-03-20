import { useDroppable } from '@dnd-kit/react';

import {
  ATTACK_CANVAS_DROP_ID,
  SIDEBAR_ATTACK_DRAG_TYPE,
} from '@/components/rotation-builder/rotation-timeline/constants';
import { Row } from '@/components/ui/layout';
import { useTeamAttackInstances } from '@/hooks/useTeamAttackInstances';
import { cn } from '@/lib/utils';
import { useStore } from '@/store';
import type { TimelineDragData } from '@/types/dnd';

import { AttackCanvasItem, BaseAttackCanvasItem } from './AttackCanvasItem';

interface AttackCanvasProperties {
  previewInsertIndex?: number;
}

export const AttackCanvas = ({ previewInsertIndex }: AttackCanvasProperties) => {
  const { attacks } = useTeamAttackInstances();
  const removeAttack = useStore((state) => state.removeAttack);
  const { ref, isDropTarget } = useDroppable<TimelineDragData>({
    id: ATTACK_CANVAS_DROP_ID,
    accept: (source) => source.type === SIDEBAR_ATTACK_DRAG_TYPE,
  });

  const hasPreview = previewInsertIndex !== undefined;
  const isValidDropTarget = isDropTarget && hasPreview;
  const attackCards = attacks.flatMap((attack, index) => {
    const cards = [];
    if (previewInsertIndex === index) {
      cards.push(<BaseAttackCanvasItem key="attack-drop-preview" />);
    }
    cards.push(
      <AttackCanvasItem
        key={attack.instanceId}
        attack={attack}
        index={index}
        onRemove={removeAttack}
        isDialogClickable={true}
      />,
    );
    return cards;
  });
  if (previewInsertIndex === attacks.length) {
    attackCards.push(<BaseAttackCanvasItem key="attack-drop-preview" />);
  }

  return (
    <div
      ref={ref}
      data-testid="attack-canvas"
      className={cn(
        'py-trim flex h-full w-full items-center',
        isValidDropTarget && 'bg-accent/10',
      )}
    >
      <Row
        data-testid="attack-canvas-row"
        gap="trim"
        justify="start"
        className="h-56 w-fit"
      >
        {attackCards}
      </Row>
    </div>
  );
};
