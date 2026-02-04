import React from 'react';

import type { DetailedModifierInstance } from '@/schemas/rotation';

import { CanvasItem } from '../../common/CanvasItem';

interface BuffTimelineCanvasItemProps extends React.HTMLAttributes<HTMLDivElement> {
  buff: DetailedModifierInstance;
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
      text={`${buff.characterName} - ${buff.name}`}
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
