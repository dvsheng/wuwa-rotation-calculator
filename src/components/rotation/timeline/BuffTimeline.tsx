import { useContainerWidth } from 'react-grid-layout';

import { useRotationStore } from '@/store/useRotationStore';

import { BuffPalette } from './BuffPalette';
import { BuffTimelineCanvas } from './BuffTimelineCanvas';
import { RotationTimeline } from './RotationTimeline';

export const BuffTimeline = () => {
  const attacks = useRotationStore((state) => state.attacks);
  const { width, containerRef, mounted } = useContainerWidth();

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
          <BuffPalette />
        </>
      )}
    </div>
  );
};
