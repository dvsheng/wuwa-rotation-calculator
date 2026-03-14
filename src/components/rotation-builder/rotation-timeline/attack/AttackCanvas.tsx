import { useDroppable } from '@dnd-kit/react';

import {
  ATTACK_CANVAS_DROP_ID,
  SIDEBAR_ATTACK_DRAG_TYPE,
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
    accept: (source) => source.type === SIDEBAR_ATTACK_DRAG_TYPE,
  });

  const hasPreview = previewInsertIndex !== undefined;
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
    <Container
      ref={ref}
      className={cn(
        'py-tight flex h-58 flex-1 items-center justify-center',
        isDropTarget && 'bg-accent/10',
      )}
    >
      {attacks.length === 0 && !hasPreview && (
        <Text variant="bodySm" tone="muted">
          Drag attacks here to start building your rotation.
        </Text>
      )}
      <Row gap="tight" align="start" fullWidth className="px-panel">
        {attackCards}
      </Row>
    </Container>
  );
};
