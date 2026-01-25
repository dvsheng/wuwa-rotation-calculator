import React from 'react';

import type { BuffWithPosition } from '@/schemas/rotation';

import { CanvasItem } from '../../common/CanvasItem';

interface BuffTimelineCanvasItemProps extends React.HTMLAttributes<HTMLDivElement> {
  buff: BuffWithPosition;
  onRemove: (timelineId: string) => void;
  onSaveParameters: (
    timelineId: string,
    parameterValues: Array<number | undefined>,
  ) => void;
}

export const BuffTimelineCanvasItem = React.forwardRef<
  HTMLDivElement,
  BuffTimelineCanvasItemProps
>(({ buff, onRemove, onSaveParameters, ...props }, ref) => {
  return (
    <CanvasItem
      ref={ref}
      text={buff.buff.name}
      subtext={buff.buff.characterName}
      hoverText={buff.buff.description}
      parameters={buff.buff.parameters}
      size="xs"
      onRemove={() => onRemove(buff.timelineId)}
      onSaveParameters={(vals) => onSaveParameters(buff.timelineId, vals)}
      {...props}
    />
  );
});

BuffTimelineCanvasItem.displayName = 'BuffTimelineCanvasItem';
