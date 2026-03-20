import { RestrictToHorizontalAxis } from '@dnd-kit/abstract/modifiers';
import { useSortable } from '@dnd-kit/react/sortable';
import { isNil } from 'es-toolkit/predicate';
import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';

import { CapabilityHoverCard } from '@/components/common/CapabilityHoverCard';
import { CapabilityIconDisplay } from '@/components/common/CapabilityIcon';
import { EntityIconDisplay } from '@/components/common/EntityIcon';
import { ParameterConfigurationDialog } from '@/components/common/ParameterConfigurationDialog';
import { TrashButton } from '@/components/common/TrashButton';
import {
  ATTACK_CANVAS_DROP_ID,
  ATTACK_SORTABLE_DRAG_TYPE,
  COLUMN_WIDTH,
} from '@/components/rotation-builder/rotation-timeline/constants';
import { Item } from '@/components/ui/item';
import { Text } from '@/components/ui/typography';
import type { DetailedAttackInstance } from '@/hooks/useTeamAttackInstances';
import { cn } from '@/lib/utils';
import type { CanvasAttackDragData } from '@/types/dnd';

interface AttackCanvasItemProperties {
  attack: DetailedAttackInstance;
  index: number;
  onRemove: (instanceId: string) => void;
  isDialogClickable: boolean;
}

interface BaseAttackCanvasItemProperties extends Omit<
  React.ComponentProps<'div'>,
  'ref' | 'itemRef'
> {
  cardWrapper?: (card: ReactNode) => ReactNode;
  characterIconUrl?: string;
  iconUrl?: string;
  name?: string;
  itemRef?: (element: Element | null) => void;
  isDragging?: boolean;
}

export const BaseAttackCanvasItem = ({
  cardWrapper,
  characterIconUrl,
  iconUrl,
  name,
  children,
  itemRef,
  isDragging,
  ...rest
}: BaseAttackCanvasItemProperties) => {
  const card = (
    <Item
      variant="outline"
      size="sm"
      className={cn(
        'draggable p-trim relative flex h-56 flex-col',
        isDragging && 'opacity-0',
      )}
      data-testid="attack-sort-card"
      style={{ width: COLUMN_WIDTH }}
    >
      <EntityIconDisplay url={characterIconUrl} size="large" />
      <CapabilityIconDisplay url={iconUrl} />
      <Text as="div" variant="caption" className="line-clamp-4 text-center">
        <span data-testid="attack-canvas-item-name">{name}</span>
      </Text>
      {children}
    </Item>
  );

  return (
    <div data-testid="attack-canvas-item" ref={itemRef} {...rest}>
      {cardWrapper ? cardWrapper(card) : card}
    </div>
  );
};

export const AttackCanvasItem = ({
  attack,
  index,
  onRemove,
  isDialogClickable,
}: AttackCanvasItemProperties) => {
  const { isDragging, ref } = useSortable<CanvasAttackDragData>({
    id: attack.instanceId,
    index,
    group: ATTACK_CANVAS_DROP_ID,
    type: ATTACK_SORTABLE_DRAG_TYPE,
    accept: ATTACK_SORTABLE_DRAG_TYPE,
    modifiers: [RestrictToHorizontalAxis],
    data: {
      kind: 'canvas-attack',
      capability: attack,
    },
  });

  const isAttackConfigurable = (attack.parameters?.length ?? 0) > 0;
  const shouldShowWarning =
    isAttackConfigurable &&
    (attack.parameters?.some(
      (parameter) => Number.isNaN(parameter.value) || isNil(parameter.value),
    ) ??
      false);

  return (
    <BaseAttackCanvasItem
      cardWrapper={(card) => (
        <ParameterConfigurationDialog
          capability={attack}
          disabled={!(isAttackConfigurable && isDialogClickable)}
        >
          <div className="contents">
            <CapabilityHoverCard capability={attack}>{card}</CapabilityHoverCard>
          </div>
        </ParameterConfigurationDialog>
      )}
      characterIconUrl={attack.characterIconUrl}
      iconUrl={attack.iconUrl}
      name={attack.name}
      itemRef={ref}
      isDragging={isDragging}
    >
      <Text as="span" variant="caption" tone="muted" className="absolute top-1 left-1">
        {index + 1}
      </Text>
      <TrashButton
        className="absolute bottom-1 left-1/2 -translate-x-1/2"
        onRemove={() => onRemove(attack.instanceId)}
        stopPropagation={true}
      />
      {shouldShowWarning && (
        <AlertTriangle className="absolute top-1 right-1 h-5 w-5 text-amber-500" />
      )}
    </BaseAttackCanvasItem>
  );
};
