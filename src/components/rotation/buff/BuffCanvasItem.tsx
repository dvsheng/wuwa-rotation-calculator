import React, { useMemo } from 'react';

import {
  getAlignmentSegments,
  useSelfBuffAlignment,
} from '@/hooks/useSelfBuffAlignment';
import type { DetailedModifierInstance } from '@/schemas/rotation';
import { Target } from '@/services/game-data/common-types';

import { CanvasItem } from '../../common/CanvasItem';

import { TARGET_COLORS } from './BuffPalette';

/** Classes for self buffs with segments (border + text, background handled by segments) */
const SELF_BASE_CLASSES = 'border-blue-400 text-black bg-transparent';

/** Classes for fully misaligned self buffs (outline only) */
const SELF_MISALIGNED_CLASSES = 'border-blue-400 bg-transparent text-black';

interface BuffTimelineCanvasItemProperties extends React.HTMLAttributes<HTMLDivElement> {
  buff: DetailedModifierInstance;
  onRemove: (instanceId: string) => void;
  onSaveParameters: (instanceId: string, parameterValues: Array<number>) => void;
}

export const BuffTimelineCanvasItem = React.forwardRef<
  HTMLDivElement,
  BuffTimelineCanvasItemProperties
>(({ buff, onRemove, onSaveParameters, ...properties }, reference) => {
  const alignment = useSelfBuffAlignment(buff);

  const parameters = buff.parameters?.map((p) => ({
    ...p,
    value: p.value ?? p.minimum,
  }));

  // Generate styling and segments based on target and alignment
  const { itemClassName, segments } = useMemo(() => {
    // Non-self buffs use standard colors
    if (buff.target !== Target.SELF) {
      return { itemClassName: TARGET_COLORS[buff.target], segments: [] };
    }

    // Self buff styling based on alignment status
    switch (alignment.status) {
      case 'all-aligned': {
        // Fully aligned: solid fill
        return { itemClassName: TARGET_COLORS[Target.SELF], segments: [] };
      }
      case 'all-misaligned': {
        // Fully misaligned: outline only
        return { itemClassName: SELF_MISALIGNED_CLASSES, segments: [] };
      }
      case 'mixed': {
        // Partially aligned: render individual segments with rounded corners
        const alignmentSegments = getAlignmentSegments(alignment.columnAlignments);
        return {
          itemClassName: SELF_BASE_CLASSES,
          segments: alignmentSegments,
        };
      }
      default: {
        return { itemClassName: TARGET_COLORS[buff.target], segments: [] };
      }
    }
  }, [buff.target, alignment.status, alignment.columnAlignments]);

  return (
    <CanvasItem
      ref={reference}
      text={`${buff.characterName} - ${buff.name}`}
      hoverText={buff.description}
      parameters={parameters}
      size="xs"
      itemClassName={itemClassName}
      onRemove={() => onRemove(buff.instanceId)}
      onSaveParameters={(vals) =>
        onSaveParameters(
          buff.instanceId,
          vals.map((v) => v ?? 0),
        )
      }
      {...properties}
    >
      {/* Render alignment segments as rounded overlays */}
      {segments.map((segment, index) => (
        <div
          key={index}
          className="pointer-events-none absolute inset-y-0 rounded-md bg-blue-200"
          style={{
            left: `${segment.start}%`,
            width: `${segment.width}%`,
          }}
        />
      ))}
    </CanvasItem>
  );
});

BuffTimelineCanvasItem.displayName = 'BuffTimelineCanvasItem';
