import { useDroppable } from '@dnd-kit/react';

import {
  ATTACK_CANVAS_DROP_ID,
  SIDEBAR_ATTACK_DRAG_TYPE,
  SIDEBAR_BUFF_DRAG_TYPE,
  getTimelineWidth,
} from '@/components/rotation-builder/rotation-timeline/constants';
import { Container, Row } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';
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
    accept: (source) =>
      source.type === SIDEBAR_ATTACK_DRAG_TYPE ||
      source.type === SIDEBAR_BUFF_DRAG_TYPE,
  });
  const timelineWidth = getTimelineWidth(
    Math.max(attacks.length, (previewInsertIndex ?? -1) + 1),
  );

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
    <Container className="py-trim h-58">
      <div
        ref={ref}
        className={cn(
          'flex h-full items-center justify-center',
          isValidDropTarget && 'bg-accent/10',
        )}
        style={{ minWidth: timelineWidth, width: timelineWidth }}
      >
        {attacks.length === 0 && !hasPreview && (
          <Text variant="bodySm" tone="muted">
            Drag attacks here to start building your rotation.
          </Text>
        )}
        {attacks.length > 0 || hasPreview ? (
          <Row
            data-testid="attack-canvas-row"
            gap="trim"
            align="start"
            fullWidth
            className="h-full"
          >
            {attackCards}
          </Row>
        ) : undefined}
      </div>
    </Container>
  );
};
