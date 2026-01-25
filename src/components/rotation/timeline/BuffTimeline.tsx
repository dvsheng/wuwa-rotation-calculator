import { useContainerWidth } from 'react-grid-layout';

import { useTeamModifiers } from '@/hooks/useTeamModifiers';
import type { Buff } from '@/schemas/rotation';
import { useRotationStore } from '@/store/useRotationStore';
import { useTeamStore } from '@/store/useTeamStore';

import { BuffPalette } from './BuffPalette';
import { BuffTimelineCanvas } from './BuffTimelineCanvas';
import { RotationTimeline } from './RotationTimeline';

export const BuffTimeline = () => {
  const attacks = useRotationStore((state) => state.attacks);
  const addBuff = useRotationStore((state) => state.addBuff);
  const team = useTeamStore((state) => state.team);
  const { buffs } = useTeamModifiers(team);
  const { width, containerRef, mounted } = useContainerWidth();

  const handleAddBuff = (buff: Buff) => {
    addBuff(buff, { x: 0, y: 0, w: 2, h: 1 });
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
          <BuffTimelineCanvas width={width} gridConfig={gridConfig} />
          <BuffPalette buffs={buffs} onClickBuff={handleAddBuff} />
        </>
      )}
    </div>
  );
};
