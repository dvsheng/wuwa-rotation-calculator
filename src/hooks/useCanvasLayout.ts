import { merge } from 'es-toolkit/object';
import { useRef, useState } from 'react';
import type { GridLayoutProps } from 'react-grid-layout';

import { useRotationStore } from '@/store/useRotationStore';

export const useCanvasLayout = (
  partialProperties?: Partial<Omit<GridLayoutProps, 'children'>>,
) => {
  const rotationAttackCount = useRotationStore((state) => state.attacks.length);
  const [isInteracting, setIsInteracting] = useState(false);
  const interactionTimeoutReference = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const columnCount = Math.max(rotationAttackCount, 5);

  // Calculate grid width based on column count for scrolling
  // Each column is approximately 120px wide with 10px margin
  const COLUMN_WIDTH = 120;
  const MARGIN = 10;
  const calculatedWidth = columnCount * (COLUMN_WIDTH + MARGIN);

  // Use calculated width directly to avoid gradual resize animations
  // The container will handle its own scrolling if needed
  const width = calculatedWidth;

  // Event handlers that reference the interaction timeout ref
  const eventHandlers = {
    onDragStart: () => {
      if (interactionTimeoutReference.current !== null) {
        clearTimeout(interactionTimeoutReference.current);
      }
      setIsInteracting(true);
    },
    onDragStop: () => {
      if (interactionTimeoutReference.current !== null) {
        clearTimeout(interactionTimeoutReference.current);
      }
      interactionTimeoutReference.current = globalThis.setTimeout(() => {
        setIsInteracting(false);
      }, 100);
    },
    onResizeStart: () => {
      if (interactionTimeoutReference.current !== null) {
        clearTimeout(interactionTimeoutReference.current);
      }
      setIsInteracting(true);
    },
    onResizeStop: () => {
      if (interactionTimeoutReference.current !== null) {
        clearTimeout(interactionTimeoutReference.current);
      }
      interactionTimeoutReference.current = globalThis.setTimeout(() => {
        setIsInteracting(false);
      }, 100);
    },
  };

  // Base layout config without event handlers
  const baseLayoutConfig = {
    width,
    gridConfig: {
      cols: columnCount,
      rowHeight: 280,
    },
    style: {
      minHeight: 280,
    },
    dropConfig: { enabled: true },
    dragConfig: { enabled: true },
  };

  // Merge config with partial properties, then add event handlers
  const layout = partialProperties
    ? { ...merge(baseLayoutConfig, partialProperties), ...eventHandlers }
    : { ...baseLayoutConfig, ...eventHandlers };

  return {
    layout,
    isInteracting,
  };
};
