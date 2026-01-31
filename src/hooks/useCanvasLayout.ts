import type { GridLayoutProps } from 'react-grid-layout';
import { useContainerWidth } from 'react-grid-layout';

import { useRotationStore } from '@/store/useRotationStore';

export const useCanvasLayout = () => {
  const rotationAttackCount = useRotationStore((state) => state.attacks.length);
  const { width, containerRef } = useContainerWidth();

  const columnCount = Math.max(rotationAttackCount + 1, 5);
  const layout: Omit<GridLayoutProps, 'children'> = {
    width,
    gridConfig: {
      cols: columnCount,
    },
    style: {
      minHeight: 100,
    },
    dropConfig: { enabled: true },
    dragConfig: { enabled: true },
  };

  return {
    layout,
    containerRef,
  };
};
