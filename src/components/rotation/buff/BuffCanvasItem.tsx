import { AlertTriangle, Trash2 } from 'lucide-react';

import { CanvasItem } from '@/components/common/CanvasItem';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/typography';
import { useCapabilityIcon, useEntityIcon } from '@/hooks/useIcons';
import {
  getAlignmentSegments,
  useSelfBuffAlignment,
} from '@/hooks/useSelfBuffAlignment';
import type { AlignmentSegment } from '@/hooks/useSelfBuffAlignment';
import type { DetailedModifierInstance } from '@/hooks/useTeamModifierInstances';
import { cn } from '@/lib/utils';
import { Target } from '@/services/game-data/types';
import { useStore } from '@/store';

import { TARGET_COLORS } from './BuffPalette';

/** Classes for self buffs with segments (border + text, background handled by segments) */
const SELF_BASE_CLASSES = 'border-blue-400 text-black bg-transparent';

/** Classes for fully misaligned self buffs (outline only) */
const SELF_MISALIGNED_CLASSES = 'border-blue-400 bg-transparent text-black';

interface BuffTimelineCanvasItemProperties {
  buff: DetailedModifierInstance;
  onRemove: (instanceId: string) => void;
  isInteracting: boolean;
}

export const BuffTimelineCanvasItem = ({
  buff,
  onRemove,
  isInteracting,
}: BuffTimelineCanvasItemProperties) => {
  const updateBuffParameters = useStore((state) => state.updateBuffParameters);
  const alignment = useSelfBuffAlignment(buff);

  const { data: iconUrl } = useCapabilityIcon(buff.id, 'modifier');
  const { data: characterIconUrl } = useEntityIcon(buff.characterId);

  const parameters = buff.parameters?.map((p) => ({
    ...p,
    value: p.value,
  }));

  // Generate styling and segments based on target and alignment
  const getItemClassNameAndSegments = (): {
    itemClassName: string;
    segments: Array<AlignmentSegment>;
  } => {
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
  };

  const { itemClassName, segments } = getItemClassNameAndSegments();

  return (
    <CanvasItem
      title={buff.name}
      subtitle={buff.characterName}
      description={buff.description}
      parameters={parameters}
      onSaveParameters={(vals) => updateBuffParameters(buff.instanceId, vals)}
      isInteracting={isInteracting}
    >
      {({ shouldShowWarning }) => (
        <div
          className={cn(
            'relative flex h-full flex-row items-center gap-2 overflow-hidden rounded-lg border px-2 py-1 transition-colors',
            itemClassName,
          )}
        >
          {/* Background overlay segments (e.g., alignment indicators) */}
          {segments.map((segment, index) => (
            <div
              key={index}
              className="pointer-events-none absolute inset-y-0 z-0 rounded-md bg-blue-100"
              style={{
                left: `${segment.start}%`,
                width: `${segment.width}%`,
              }}
            />
          ))}

          {/* Character icon */}
          {characterIconUrl && (
            <div className="border-border relative z-10 flex aspect-square h-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border bg-zinc-800">
              <img
                src={characterIconUrl}
                alt={buff.characterName}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          {/* Capability icon */}
          {iconUrl && (
            <div className="border-border relative z-10 flex aspect-square h-8 flex-shrink-0 items-center justify-center rounded-md border bg-zinc-700">
              <img
                src={iconUrl}
                alt={buff.name}
                className="h-full w-full object-contain p-0.5"
              />
            </div>
          )}

          {/* Buff name */}
          <Text className="relative z-10 line-clamp-2 min-w-0 flex-1 text-left text-xs leading-tight font-medium">
            {buff.name}
          </Text>

          {/* Warning indicator */}
          {shouldShowWarning && (
            <AlertTriangle
              data-testid="alert-triangle"
              className="relative z-10 h-5 w-5 flex-shrink-0 text-amber-500"
            />
          )}

          {/* Delete button at right */}
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive relative z-10 h-6 w-6 flex-shrink-0"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onRemove(buff.instanceId);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </CanvasItem>
  );
};
