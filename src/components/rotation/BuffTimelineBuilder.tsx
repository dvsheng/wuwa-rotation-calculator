import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { GridLayoutProps } from 'react-grid-layout';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Text } from '@/components/ui/typography';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import type { Capability } from '@/schemas/rotation';
import { CapabilitySchema } from '@/schemas/rotation';
import { useRotationStore } from '@/store/useRotationStore';

import { BuffPalette } from './timeline/BuffPalette';
import { BuffTimelineCanvas } from './timeline/BuffTimelineCanvas';

interface BuffTimelineBuilderProps {
  gridLayoutProps: Omit<GridLayoutProps, 'children'>;
}

export const BuffTimelineBuilder = ({ gridLayoutProps }: BuffTimelineBuilderProps) => {
  const [paletteOpen, setPaletteOpen] = useState(true);
  const addBuff = useRotationStore((state) => state.addBuff);
  const { handleDragStart, createHandleDrop } = useDragAndDrop({
    schema: CapabilitySchema,
  });

  const handleDropBuff = createHandleDrop((buff, item) => {
    addBuff(buff, {
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
    });
  });

  const handleAddBuff = (buff: Capability) => {
    addBuff(buff, { x: 0, y: 0, w: 2, h: 1 });
  };

  return (
    <>
      {/* Buff Canvas */}
      <div className="border-t">
        <div className="px-4 py-2">
          <Text className="text-sm font-semibold tracking-wider uppercase">
            Buff Canvas
          </Text>
        </div>
        <div className="px-4 pb-4">
          <BuffTimelineCanvas
            gridLayoutProps={gridLayoutProps}
            onDropBuff={handleDropBuff}
          />
        </div>
      </div>

      {/* Buff Palette - Collapsible */}
      <Collapsible open={paletteOpen} onOpenChange={setPaletteOpen}>
        <CollapsibleTrigger asChild>
          <div className="hover:bg-accent/50 flex cursor-pointer items-center justify-between border-t px-4 py-2 transition-colors">
            <Text className="text-sm font-semibold tracking-wider uppercase">
              Buff Palette
            </Text>
            <ChevronDown
              className={`text-muted-foreground h-4 w-4 transition-transform ${
                paletteOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <BuffPalette onClickBuff={handleAddBuff} onDragBuff={handleDragStart} />
        </CollapsibleContent>
      </Collapsible>
    </>
  );
};
