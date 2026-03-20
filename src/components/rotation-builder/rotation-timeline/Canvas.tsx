import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useContainerWidth } from 'react-grid-layout';

import { Button } from '@/components/ui/button';
import { Stack } from '@/components/ui/layout';
import { Separator } from '@/components/ui/separator';
import type { ScrollButtonProperties } from '@/hooks/useScrollControls';
import { useScrollControls } from '@/hooks/useScrollControls';
import { useTeamAttackInstances } from '@/hooks/useTeamAttackInstances';
import { useTeamModifierInstances } from '@/hooks/useTeamModifierInstances';

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
  const { attacks } = useTeamAttackInstances();
  const { buffs } = useTeamModifierInstances();

  const attacksEmpty = attacks.length === 0 && attackPreviewInsertIndex === undefined;
  const buffsEmpty = buffs.length === 0 && !buffPreviewLayout;

  return (
    <div className="relative flex min-h-0 w-full min-w-0 flex-1">
      <div ref={ref} className="bg-card h-full w-full min-w-0 overflow-auto">
        <Stack className="min-h-full min-w-max">
          {/*
           * Outer div is sticky + full-width so the empty overlay can span the
           * visible viewport, not just the w-fit content width of the inner row.
           * The attack canvas is always rendered (never conditionally replaced by an
           * empty state) because its container is the width-measurement anchor for the
           * buff canvas via useContainerWidth. Unmounting it would break the width sync,
           * so we overlay the empty message instead.
           */}
          <div className="bg-card sticky top-0 z-50 shrink-0">
            {/* sticky top-0 keeps the attack row visible while scrolling down */}
            {/* repeat bg-card so that buff canvas underneath isn't visible while scrolling */}
            {/* min-w-149 is the width of BUFF_LENGTH_ON_ADD * AttackCanvasItem width */}
            <div ref={containerRef} className="flex w-fit min-w-149">
              <AttackCanvas previewInsertIndex={attackPreviewInsertIndex} />
            </div>
            {attacksEmpty && (
              <div
                data-testid="attack-empty-state"
                className="text-muted-foreground pointer-events-none absolute inset-0 flex items-center justify-center text-sm"
              >
                No attacks to display. Drag or click an attack in the palette to add it
                here.
              </div>
            )}
          </div>
          <Separator className="shrink-0" />
          <div className="relative flex min-h-0 flex-1 flex-col">
            {/*
             * Same reasoning as above: BuffCanvas must stay mounted so that
             * useContainerWidth (measured from the attack row above) keeps driving
             * its width prop correctly. The empty overlay avoids any layout shift
             * that would occur if we swapped the grid in and out.
             */}
            {mounted && <BuffCanvas previewLayout={buffPreviewLayout} width={width} />}
            {buffsEmpty && (
              <div
                data-testid="buff-empty-state"
                className="text-muted-foreground pointer-events-none absolute inset-0 flex items-center justify-center text-sm"
              >
                No buffs to display. Drag or click a buff in the palette to add it here.
              </div>
            )}
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
  className: `bg-muted/60 hover:bg-muted/80 disabled:bg-muted/20 disabled:text-foreground/30 absolute top-1/2 ${side}-1 z-10 h-16 -translate-y-1/2 transition-colors`,
  ...controls,
});
