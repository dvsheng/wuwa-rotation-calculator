import React from 'react';

import type { DetailedModifierInstance } from '@/schemas/rotation';

import { CanvasItem } from '../../common/CanvasItem';

interface BuffTimelineCanvasItemProperties extends React.HTMLAttributes<HTMLDivElement> {
  buff: DetailedModifierInstance;
  onRemove: (instanceId: string) => void;
  onSaveParameters: (instanceId: string, parameterValues: Array<number>) => void;
}

export const BuffTimelineCanvasItem = React.forwardRef<
  HTMLDivElement,
  BuffTimelineCanvasItemProperties
>(({ buff, onRemove, onSaveParameters, ...properties }, reference) => {
  const parameters = buff.parameters?.map((p) => ({
    ...p,
    value: p.value ?? p.minimum,
  }));

  return (
    <CanvasItem
      ref={reference}
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
      {...properties}
    />
  );
});

BuffTimelineCanvasItem.displayName = 'BuffTimelineCanvasItem';
