import type { GridLayoutProps } from 'react-grid-layout';
import { useContainerWidth } from 'react-grid-layout';

import { useRotationStore } from '@/store/useRotationStore';

export const COL_WIDTH = 140;
export const GRID_MARGIN: [number, number] = [4, 0];
export const GRID_PADDING: [number, number] = [0, 0];

export const useCanvasLayout = () => {
  const rotationAttackCount = useRotationStore((state) => state.attacks.length);
  const { width, containerRef } = useContainerWidth();

  const columnCount = Math.max(rotationAttackCount + 1, 5);
  const containerWidth = Math.max(width, columnCount * COL_WIDTH);
  const layout: Omit<GridLayoutProps, 'children'> = {
    width: containerWidth,
    gridConfig: {
      cols: columnCount,
      margin: GRID_MARGIN,
      containerPadding: GRID_PADDING,
    },
    style: {
      minWidth: containerWidth,
    },
    dropConfig: { enabled: true },
    dragConfig: { enabled: true },
  };

  return {
    layout,
    containerRef,
  };
};
