import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Text } from '@/components/ui/typography';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import type { BuffWithPosition } from '@/schemas/rotation';
import { BuffSchema } from '@/schemas/rotation';
import { useRotationStore } from '@/store/useRotationStore';
import type { DetailedBuff } from '@/types/client/capability';

import { BuffPalette } from './timeline/BuffPalette';
import { BuffTimelineCanvas } from './timeline/BuffTimelineCanvas';
import type { SharedGridConfig } from './types';

interface BuffTimelineBuilderProps {
  availableBuffs: Array<DetailedBuff>;
  enrichedBuffs: Array<DetailedBuff & BuffWithPosition>;
  gridConfig: SharedGridConfig;
  isLoading: boolean;
}

export const BuffTimelineBuilder = ({
  availableBuffs,
  enrichedBuffs,
  gridConfig,
  isLoading,
}: BuffTimelineBuilderProps) => {
  const [paletteOpen, setPaletteOpen] = useState(true);

  const addBuff = useRotationStore((state) => state.addBuff);

  // Drag and drop handlers for buffs
  const { handleDragStart } = useDragAndDrop({
    schema: BuffSchema,
  });

  const handleAddBuff = (buff: DetailedBuff) => {
    addBuff(
      {
        id: buff.id,
        characterId: buff.characterId,
      },
      { x: 0, y: 0, w: 2, h: 1 },
    );
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
          <BuffTimelineCanvas buffs={enrichedBuffs} gridConfig={gridConfig} />
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
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Text variant="muted">Loading buffs...</Text>
            </div>
          ) : (
            <BuffPalette
              buffs={availableBuffs}
              onClickBuff={handleAddBuff}
              onDragBuff={handleDragStart}
            />
          )}
        </CollapsibleContent>
      </Collapsible>
    </>
  );
};
