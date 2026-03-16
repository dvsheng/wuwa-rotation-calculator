import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useContainerWidth } from 'react-grid-layout';

import { Button } from '@/components/ui/button';
import { Stack } from '@/components/ui/layout';
import { Separator } from '@/components/ui/separator';
import type { ScrollButtonProperties } from '@/hooks/useScrollControls';
import { useScrollControls } from '@/hooks/useScrollControls';

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
  const { ref, scrollBackProps, scrollForwardProps } = useScrollControls();

  return (
    <div className="relative flex min-h-0 w-full min-w-0 flex-1">
      <div ref={ref} className="bg-card h-full w-full min-w-0 overflow-auto">
        <Stack className="min-h-full min-w-max">
          {/* sticky top-0 keeps the attack row visible while scrolling down */}
          {/* repeat bg-card so that buff canvas underneath isn't visible while scrolling */}
          <div ref={containerRef} className="bg-card sticky top-0 z-50 w-fit shrink-0">
            <AttackCanvas previewInsertIndex={attackPreviewInsertIndex} />
          </div>
          <Separator className="shrink-0" />
          <div className="min-h-0 flex-1">
            {mounted && <BuffCanvas previewLayout={buffPreviewLayout} width={width} />}
          </div>
        </Stack>
      </div>

      <Button {...scrollButtonProperties('left', scrollBackProps)}>
        <ChevronLeft />
      </Button>

      <Button {...scrollButtonProperties('right', scrollForwardProps)}>
        <ChevronRight />
      </Button>
    </div>
  );
};

const scrollButtonProperties = (
  side: 'left' | 'right',
  controls: ScrollButtonProperties,
) => ({
  variant: 'ghost' as const,
  size: 'icon' as const,
  'aria-label': `Scroll ${side}`,
  className: `bg-muted/60 hover:bg-muted/80 disabled:bg-muted/20 disabled:text-foreground/30 absolute top-1/2 ${side}-1 z-10 h-16 -translate-y-1/2 transition-colors`,
  ...controls,
});
