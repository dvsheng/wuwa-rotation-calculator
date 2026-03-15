import { merge } from 'es-toolkit/object';
import { useEffect, useRef, useState } from 'react';
import type { GridLayoutProps } from 'react-grid-layout';

import {
  ATTACK_ROW_HEIGHT,
  COLUMN_MARGIN,
  getTimelineColumnCount,
  getTimelineWidth,
} from '@/components/rotation-builder/rotation-timeline/constants';
import { useStore } from '@/store';

export const useCanvasLayout = (
  partialProperties?: Partial<Omit<GridLayoutProps, 'children'>>,
) => {
  const rotationAttackCount = useStore((state) => state.attacks.length);
  const [isInteracting, setIsInteracting] = useState(false);
  const interactionTimeoutReference = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const columnCount = getTimelineColumnCount(rotationAttackCount);
  const width = getTimelineWidth(rotationAttackCount);

  const {
    onDragStart: externalOnDragStart,
    onDragStop: externalOnDragStop,
    onResizeStart: externalOnResizeStart,
    onResizeStop: externalOnResizeStop,
    ...layoutProperties
  } = partialProperties ?? {};

  const clearInteractionTimeout = () => {
    if (interactionTimeoutReference.current !== undefined) {
      clearTimeout(interactionTimeoutReference.current);
      interactionTimeoutReference.current = undefined;
    }
  };

  const startInteraction = () => {
    clearInteractionTimeout();
    setIsInteracting(true);
  };

  const stopInteraction = (delayMs = 100) => {
    clearInteractionTimeout();
    interactionTimeoutReference.current = globalThis.setTimeout(() => {
      setIsInteracting(false);
      interactionTimeoutReference.current = undefined;
    }, delayMs);
  };

  const handleDragStart: NonNullable<GridLayoutProps['onDragStart']> = (
    ...arguments_
  ) => {
    startInteraction();
    externalOnDragStart?.(...arguments_);
  };

  const handleDragStop: NonNullable<GridLayoutProps['onDragStop']> = (
    ...arguments_
  ) => {
    stopInteraction();
    externalOnDragStop?.(...arguments_);
  };

  const handleResizeStart: NonNullable<GridLayoutProps['onResizeStart']> = (
    ...arguments_
  ) => {
    startInteraction();
    externalOnResizeStart?.(...arguments_);
  };

  const handleResizeStop: NonNullable<GridLayoutProps['onResizeStop']> = (
    ...arguments_
  ) => {
    stopInteraction();
    externalOnResizeStop?.(...arguments_);
  };

  // Clear any pending interaction timeout when the hook unmounts.
  useEffect(() => {
    return () => {
      if (interactionTimeoutReference.current !== undefined) {
        clearTimeout(interactionTimeoutReference.current);
      }
    };
  }, []);

  // While a drag/resize interaction is active, listen for global end signals
  // so interaction state still resets even if grid-level stop callbacks are missed.
  useEffect(() => {
    if (!isInteracting) return;

    const scheduleInteractionEnd = (delayMs = 0) => {
      if (interactionTimeoutReference.current !== undefined) {
        clearTimeout(interactionTimeoutReference.current);
      }

      interactionTimeoutReference.current = globalThis.setTimeout(() => {
        setIsInteracting(false);
        interactionTimeoutReference.current = undefined;
      }, delayMs);
    };

    const handleInteractionEnd = () => {
      scheduleInteractionEnd();
    };

    const handleVisibilityChange = () => {
      if (globalThis.document.visibilityState === 'hidden') {
        scheduleInteractionEnd();
      }
    };

    globalThis.addEventListener('pointerup', handleInteractionEnd);
    globalThis.addEventListener('pointercancel', handleInteractionEnd);
    globalThis.addEventListener('mouseup', handleInteractionEnd);
    globalThis.addEventListener('touchend', handleInteractionEnd);
    globalThis.addEventListener('dragend', handleInteractionEnd);
    globalThis.addEventListener('blur', handleInteractionEnd);
    globalThis.document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      globalThis.removeEventListener('pointerup', handleInteractionEnd);
      globalThis.removeEventListener('pointercancel', handleInteractionEnd);
      globalThis.removeEventListener('mouseup', handleInteractionEnd);
      globalThis.removeEventListener('touchend', handleInteractionEnd);
      globalThis.removeEventListener('dragend', handleInteractionEnd);
      globalThis.removeEventListener('blur', handleInteractionEnd);
      globalThis.document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange,
      );
    };
  }, [isInteracting]);

  // Base layout config without event handlers
  const baseLayoutConfig = {
    width,
    gridConfig: {
      cols: columnCount,
      rowHeight: ATTACK_ROW_HEIGHT,
      margin: [COLUMN_MARGIN, COLUMN_MARGIN] as const,
    },
    style: {
      minHeight: ATTACK_ROW_HEIGHT,
    },
    dropConfig: { enabled: true },
    dragConfig: { enabled: true, bounded: true },
  };

  const mergedLayoutConfig = merge(baseLayoutConfig, layoutProperties);

  const layout = {
    ...mergedLayoutConfig,
    onDragStart: handleDragStart,
    onDragStop: handleDragStop,
    onResizeStart: handleResizeStart,
    onResizeStop: handleResizeStop,
  };

  return {
    layout,
    isInteracting,
  };
};
