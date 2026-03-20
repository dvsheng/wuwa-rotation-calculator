import type { DragEndEvent } from '@dnd-kit/dom';
import { isSortable } from '@dnd-kit/react/sortable';
import { useState } from 'react';

import {
  ATTACK_CANVAS_DROP_ID,
  BUFF_CANVAS_DROP_ID,
  BUFF_ROW_HEIGHT,
  COLUMN_STEP,
  INITIAL_BUFF_LAYOUT,
  ROW_GAP,
  SIDEBAR_ATTACK_DRAG_TYPE,
  SIDEBAR_BUFF_DRAG_TYPE,
  getTimelineColumnCount,
} from '@/components/rotation-builder/rotation-timeline/constants';
import type { Capability } from '@/schemas/rotation';

type DragEndPayload = Parameters<DragEndEvent>[0];

export interface BuffDropPreview {
  x: number;
  y: number;
  w: number;
  h: number;
  characterIconUrl?: string;
  iconUrl?: string;
  name?: string;
}

interface UseRotationTimelineDndProperties {
  addAttack: (attack: Capability, atIndex?: number) => void;
  addBuff: (
    buff: Capability,
    layout: { x: number; y: number; w: number; h: number },
  ) => void;
  attackCount: number;
  reorderAttacks: (fromIndex: number, toIndex: number) => void;
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), maximum);

const getNativeEventCoordinates = (
  event?: Event,
): { x: number; y: number } | undefined => {
  if (!event) return;

  if (event instanceof MouseEvent) {
    return { x: event.clientX, y: event.clientY };
  }

  if (
    typeof TouchEvent !== 'undefined' &&
    event instanceof TouchEvent &&
    event.changedTouches.length > 0
  ) {
    const [touch] = event.changedTouches;
    return { x: touch.clientX, y: touch.clientY };
  }
};

const getOperationCoordinates = (
  operation: DragEndPayload['operation'],
  nativeEvent?: Event,
) => {
  const nativeCoordinates = getNativeEventCoordinates(nativeEvent);
  if (nativeCoordinates) {
    return nativeCoordinates;
  }

  const targetElement = operation.target?.element;
  if (!targetElement) return;

  const targetBounds = targetElement.getBoundingClientRect();
  const shape = operation.shape as {
    current?: {
      boundingRectangle?:
        | DOMRect
        | { left: number; top: number; width: number; height: number };
    };
  } | null;
  const dragBounds = shape?.current?.boundingRectangle;

  if (!dragBounds) {
    return {
      x: targetBounds.left + targetBounds.width / 2,
      y: targetBounds.top + targetBounds.height / 2,
    };
  }

  return {
    x: dragBounds.left + dragBounds.width / 2,
    y: dragBounds.top + dragBounds.height / 2,
  };
};

const getAttackInsertIndex = (
  operation: DragEndPayload['operation'],
  attackCount: number,
  nativeEvent?: Event,
) => {
  const targetElement = operation.target?.element;
  const coordinates = getOperationCoordinates(operation, nativeEvent);

  if (!targetElement || !coordinates) {
    return attackCount;
  }

  const bounds = targetElement.getBoundingClientRect();
  const relativeX = coordinates.x - bounds.left;
  const insertIndex = Math.floor((relativeX + COLUMN_STEP / 2) / COLUMN_STEP);

  return clamp(insertIndex, 0, attackCount);
};

const getBuffDropLayout = (
  operation: DragEndPayload['operation'],
  columnCount: number,
  nativeEvent?: Event,
) => {
  const targetElement = operation.target?.element;
  const coordinates = getOperationCoordinates(operation, nativeEvent);

  if (!targetElement || !coordinates) {
    return { ...INITIAL_BUFF_LAYOUT };
  }

  const bounds = targetElement.getBoundingClientRect();
  const availableColumnCount =
    bounds.width > 0
      ? Math.max(1, Math.round(bounds.width / COLUMN_STEP))
      : columnCount;
  const relativeX = coordinates.x - bounds.left;
  const relativeY = coordinates.y - bounds.top;
  const x = Math.floor(relativeX / COLUMN_STEP);
  const y = Math.floor(relativeY / (BUFF_ROW_HEIGHT + ROW_GAP));

  return {
    ...INITIAL_BUFF_LAYOUT,
    x: clamp(x, 0, Math.max(0, availableColumnCount - INITIAL_BUFF_LAYOUT.w)),
    y: Math.max(0, y),
  };
};

const getDefinedPreviewProperties = ({
  characterIconUrl,
  iconUrl,
  name,
}: {
  characterIconUrl?: string;
  iconUrl?: string;
  name?: string;
}) => ({
  ...(characterIconUrl === undefined ? {} : { characterIconUrl }),
  ...(iconUrl === undefined ? {} : { iconUrl }),
  ...(name === undefined ? {} : { name }),
});

export const useRotationTimelineDnd = ({
  addAttack,
  addBuff,
  attackCount,
  reorderAttacks,
}: UseRotationTimelineDndProperties) => {
  const attackColumnCount = getTimelineColumnCount(attackCount);
  const [attackPreviewInsertIndex, setAttackPreviewInsertIndex] = useState<
    number | undefined
  >();
  const [buffPreviewLayout, setBuffPreviewLayout] = useState<
    BuffDropPreview | undefined
  >();

  const clearDropPreviews = () => {
    setAttackPreviewInsertIndex(undefined);
    setBuffPreviewLayout(undefined);
  };

  const updateDropPreviews = (
    operation: DragEndPayload['operation'],
    nativeEvent?: Event,
  ) => {
    const { source, target } = operation;
    if (!source || !target) {
      clearDropPreviews();
      return;
    }

    if (
      source.type === SIDEBAR_ATTACK_DRAG_TYPE &&
      target.id === ATTACK_CANVAS_DROP_ID
    ) {
      setAttackPreviewInsertIndex(
        getAttackInsertIndex(operation, attackCount, nativeEvent),
      );
      setBuffPreviewLayout(undefined);
      return;
    }

    if (source.type === SIDEBAR_BUFF_DRAG_TYPE && target.id === BUFF_CANVAS_DROP_ID) {
      const { capability } = source.data;
      setBuffPreviewLayout({
        ...getBuffDropLayout(operation, attackColumnCount, nativeEvent),
        ...getDefinedPreviewProperties({
          name: capability.name,
          iconUrl: capability.iconUrl,
          characterIconUrl: capability.characterIconUrl,
        }),
      });
      setAttackPreviewInsertIndex(undefined);
      return;
    }

    clearDropPreviews();
  };

  const handleDragStart = () => {
    clearDropPreviews();
  };

  const handleDragOver = ({
    operation,
  }: {
    operation: DragEndPayload['operation'];
  }) => {
    updateDropPreviews(operation);
  };

  const handleDragMove = ({
    operation,
    nativeEvent,
  }: {
    operation: DragEndPayload['operation'];
    nativeEvent?: Event;
  }) => {
    updateDropPreviews(operation, nativeEvent);
  };

  const handleDragEnd = ({
    operation,
    canceled,
    nativeEvent,
  }: DragEndPayload & { nativeEvent?: Event }) => {
    clearDropPreviews();
    if (canceled) return;

    const { source, target } = operation;
    if (!source || !target) return;

    if (isSortable(source)) {
      reorderAttacks(source.initialIndex, source.index);
      return;
    }

    if (
      source.type === SIDEBAR_ATTACK_DRAG_TYPE &&
      target.id === ATTACK_CANVAS_DROP_ID
    ) {
      addAttack(
        source.data.capability,
        getAttackInsertIndex(operation, attackCount, nativeEvent),
      );
      return;
    }

    if (source.type === SIDEBAR_BUFF_DRAG_TYPE && target.id === BUFF_CANVAS_DROP_ID) {
      addBuff(
        source.data.capability,
        getBuffDropLayout(operation, attackColumnCount, nativeEvent),
      );
      return;
    }
  };

  return {
    attackPreviewInsertIndex,
    buffPreviewLayout,
    handleDragEnd,
    handleDragMove,
    handleDragOver,
    handleDragStart,
  };
};
