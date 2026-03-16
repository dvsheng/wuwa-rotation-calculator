import { useContainerWidth } from 'react-grid-layout';

import { Separator } from '@/components/ui/separator';

import { AttackCanvas } from './attack/AttackCanvas';
import { BuffCanvas } from './buff/BuffCanvas';

interface CanvasProperties {
  attackPreviewInsertIndex?: number;
  buffPreviewLayout?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export const Canvas = ({
  attackPreviewInsertIndex,
  buffPreviewLayout,
}: CanvasProperties) => {
  const { width, mounted, containerRef } = useContainerWidth();
  return (
    <div className="bg-card h-full w-full min-w-0 overflow-auto">
      <div className="flex min-h-full min-w-max flex-col">
        {/* sticky top-0 keeps the attack row visible while scrolling down */}
        {/* repeat bg-card so that buff canvas underneath isn't visible while scrolling */}
        <div ref={containerRef} className="bg-card sticky top-0 z-50 w-fit shrink-0">
          <AttackCanvas previewInsertIndex={attackPreviewInsertIndex} />
        </div>
        <Separator className="shrink-0" />
        <div className="min-h-0 flex-1">
          {mounted && <BuffCanvas previewLayout={buffPreviewLayout} width={width} />}
        </div>
      </div>
    </div>
  );
};
