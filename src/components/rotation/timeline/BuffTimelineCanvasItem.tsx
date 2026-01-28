import React from 'react';

import type { ModifierInstance } from '@/schemas/rotation';

import { CanvasItem } from '../../common/CanvasItem';

interface BuffTimelineCanvasItemProps extends React.HTMLAttributes<HTMLDivElement> {
  buff: ModifierInstance;
  onRemove: (instanceId: string) => void;
  onSaveParameters: (instanceId: string, parameterValues: Array<number>) => void;
}

export const BuffTimelineCanvasItem = React.forwardRef<
  HTMLDivElement,
  BuffTimelineCanvasItemProps
>(({ buff, onRemove, onSaveParameters, ...props }, ref) => {
  const parameters = buff.parameters?.map((p) => ({
    ...p,
    value: p.value ?? p.minimum,
  }));

  return (
    <CanvasItem
      ref={ref}
      text={buff.name}
      subtext={buff.characterName}
      hoverText={buff.description}
      parameters={parameters}
      size="xs"
      onRemove={() => onRemove(buff.instanceId)}
      onSaveParameters={(vals) =>
        onSaveParameters(
          buff.instanceId,
          vals.map((v) => v ?? 0),
        )
      }
      {...props}
    />
  );
});

BuffTimelineCanvasItem.displayName = 'BuffTimelineCanvasItem';
