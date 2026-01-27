import { useContainerWidth } from 'react-grid-layout';

import type { Attack, BuffWithPosition } from '@/schemas/rotation';
import { useRotationStore } from '@/store/useRotationStore';
import type { DetailedAttack, DetailedBuff } from '@/types/client/capability';

import { BuffPalette } from './BuffPalette';
import { BuffTimelineCanvas } from './BuffTimelineCanvas';
import { RotationTimeline } from './RotationTimeline';

interface BuffTimelineProps {
  buffs: Array<DetailedBuff & BuffWithPosition>;
  attacks: Array<DetailedAttack & Attack>;
  availableBuffs: Array<DetailedBuff>;
  isLoading: boolean;
}

export const BuffTimeline = ({
  buffs,
  attacks,
  availableBuffs,
  isLoading,
}: BuffTimelineProps) => {
  const addBuff = useRotationStore((state) => state.addBuff);
  const { width, containerRef, mounted } = useContainerWidth();

  const handleAddBuff = (buff: DetailedBuff) => {
    addBuff(
      {
        id: buff.id,
        characterId: buff.characterId,
      },
      { x: 0, y: 0, w: 2, h: 1 },
    );
  };

  const gridConfig = {
    cols: Math.max(attacks.length, 5),
    margin: [2, 1] as const,
    containerPadding: [3, 3] as const,
    maxRows: Infinity,
  };

  return (
    <div ref={containerRef} className="flex w-full flex-col gap-2">
      {mounted && (
        <>
          <RotationTimeline items={attacks} width={width} gridConfig={gridConfig} />
          <BuffTimelineCanvas buffs={buffs} width={width} gridConfig={gridConfig} />
          {isLoading ? (
            <div className="bg-muted/10 flex h-16 items-center justify-center rounded-xl border border-dashed">
              <span className="text-muted-foreground text-xs">
                Loading modifiers...
              </span>
            </div>
          ) : (
            <BuffPalette buffs={availableBuffs} onClickBuff={handleAddBuff} />
          )}
        </>
      )}
    </div>
  );
};
