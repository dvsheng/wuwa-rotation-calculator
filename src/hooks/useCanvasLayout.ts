import type { GridLayoutProps } from 'react-grid-layout';
import { useContainerWidth } from 'react-grid-layout';

import { useRotationStore } from '@/store/useRotationStore';

export const useCanvasLayout = () => {
  const rotationAttackCount = useRotationStore((state) => state.attacks.length);
  const { width: containerWidth, containerRef } = useContainerWidth();

  const columnCount = Math.max(rotationAttackCount + 1, 5);

  // Calculate grid width based on column count for scrolling
  // Each column is approximately 120px wide with 10px margin
  const COLUMN_WIDTH = 120;
  const MARGIN = 10;
  const calculatedWidth = columnCount * (COLUMN_WIDTH + MARGIN);

  // Use calculated width if it's larger than container, otherwise use container width
  const width = Math.max(containerWidth, calculatedWidth);

  const layout: Omit<GridLayoutProps, 'children'> = {
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

  return {
    layout,
    containerRef,
  };
};
