import { merge } from 'es-toolkit/object';
import { useEffect, useRef, useState } from 'react';
import type { GridLayoutProps } from 'react-grid-layout';

import { useStore } from '@/store';

export const useCanvasLayout = (
  partialProperties?: Partial<Omit<GridLayoutProps, 'children'>>,
) => {
  const rotationAttackCount = useStore((state) => state.attacks.length);
  const [isInteracting, setIsInteracting] = useState(false);
  const interactionTimeoutReference = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const columnCount = Math.max(rotationAttackCount, 5);

  // Calculate grid width based on column count for scrolling
  // Each column is approximately 96px wide with 10px margin
  const COLUMN_WIDTH = 96;
  const MARGIN = 4;
  const calculatedWidth = columnCount * (COLUMN_WIDTH + MARGIN);

  // Use calculated width directly to avoid gradual resize animations
  // The container will handle its own scrolling if needed
  const width = calculatedWidth;

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
      rowHeight: 208,
      margin: [4, 4] as const,
    },
    style: {
      minHeight: 208,
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
