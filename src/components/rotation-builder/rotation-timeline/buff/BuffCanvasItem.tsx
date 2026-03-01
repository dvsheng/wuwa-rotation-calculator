import { isNil } from 'es-toolkit/predicate';
import { AlertTriangle, Maximize2 } from 'lucide-react';
import { useState } from 'react';

import { CapabilityTooltip } from '@/components/common/CapabilityTooltip';
import { ParameterConfigurationForm } from '@/components/common/ParameterConfigurationForm';
import { TrashButton } from '@/components/common/TrashButton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Text } from '@/components/ui/typography';
import { useCapabilityIcon, useEntityIcon } from '@/hooks/useIcons';
import {
  getAlignmentSegments,
  useSelfBuffAlignment,
} from '@/hooks/useSelfBuffAlignment';
import type { AlignmentSegment } from '@/hooks/useSelfBuffAlignment';
import { useTeamAttackInstances } from '@/hooks/useTeamAttackInstances';
import type { DetailedModifierInstance } from '@/hooks/useTeamModifierInstances';
import { cn } from '@/lib/utils';
import { Target } from '@/services/game-data';
import { useStore } from '@/store';

import { TARGET_COLORS } from './BuffPalette';

/** Classes for self buffs with segments (border + text, background handled by segments) */
const SELF_BASE_CLASSES = 'border-blue-400 text-foreground bg-transparent';

/** Classes for fully misaligned self buffs (outline only) */
const SELF_MISALIGNED_CLASSES = 'border-blue-400 bg-transparent text-foreground';

interface BuffCanvasItemProperties {
  buff: DetailedModifierInstance;
  isDialogClickable: boolean;
  onRemove: (instanceId: string) => void;
  onOpenChange?: (isOpen: boolean) => void;
}

export const BuffCanvasItem = ({
  buff,
  isDialogClickable,
  onRemove,
  onOpenChange,
}: BuffCanvasItemProperties) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const updateBuffLayout = useStore((state) => state.updateBuffLayout);
  const updateBuffParameters = useStore((state) => state.updateBuffParameters);
  const { attacks } = useTeamAttackInstances();
  const alignment = useSelfBuffAlignment(buff);
  const { data: iconUrl } = useCapabilityIcon(buff.id);
  const { data: characterIconUrl } = useEntityIcon(buff.characterId);

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
  const isBuffConfigurable = buff.parameters && buff.parameters.length > 0;
  const buffedAttacks = attacks.slice(buff.x, buff.x + buff.w);
  const shouldShowWarning =
    buff.parameters?.some((parameter) => {
      const valueMissing = isNil(parameter.value) || Number.isNaN(parameter.value);
      const configMissing =
        !parameter.valueConfiguration ||
        parameter.valueConfiguration.some(
          (v) => v === 0 || isNil(v) || Number.isNaN(v),
        );
      return valueMissing && configMissing;
    }) ?? false;
  const isDialogDisabled = !isBuffConfigurable || !isDialogClickable;

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(next) => {
        if (isDialogDisabled) return;
        onOpenChange?.(next);
        setIsDialogOpen(next);
      }}
    >
      <CapabilityTooltip capability={buff}>
        <DialogTrigger asChild>
          <div
            className={cn(
              'relative flex h-full flex-row items-center gap-2 overflow-hidden rounded-lg border px-2 py-1 transition-colors',
              itemClassName,
            )}
          >
            {/* Background overlay segments */}
            {segments.map((segment, index) => (
              <div
                key={index}
                className="pointer-events-none absolute inset-y-0 -z-10 rounded-md bg-blue-100"
                style={{
                  left: `${segment.start}%`,
                  width: `${segment.width}%`,
                }}
              />
            ))}

            {/* Character icon */}
            {characterIconUrl && (
              <div className="border-border flex aspect-square h-8 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-zinc-800">
                <img
                  src={characterIconUrl}
                  alt={buff.characterName}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            {/* Capability icon */}
            {iconUrl && (
              <div className="border-border flex aspect-square h-8 shrink-0 items-center justify-center rounded-md border bg-zinc-700">
                <img
                  src={iconUrl}
                  alt={buff.name}
                  className="h-full w-full object-contain p-0.5"
                />
              </div>
            )}

            {/* Buff name */}
            <Text className="min-w-0 flex-1 truncate text-left text-xs leading-tight">
              {buff.name}
            </Text>

            {/* Warning indicator */}
            {shouldShowWarning && (
              <AlertTriangle
                data-testid="alert-triangle"
                className="h-5 w-5 shrink-0 text-amber-500"
              />
            )}

            {/* Expand button */}
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground h-6 w-6 shrink-0"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                updateBuffLayout(buff.instanceId, { x: 0, w: attacks.length });
              }}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>

            {/* Delete button */}
            <TrashButton
              className="shrink-0"
              onRemove={() => onRemove(buff.instanceId)}
            />
          </div>
        </DialogTrigger>
      </CapabilityTooltip>

      <DialogContent className="flex max-h-screen flex-col sm:max-w-lg">
        <ParameterConfigurationForm
          title={buff.name}
          description={buff.description}
          parameters={buff.parameters ?? []}
          buffedAttacks={buffedAttacks}
          onSubmit={(values) => {
            updateBuffParameters(buff.instanceId, values);
            setIsDialogOpen(false);
            onOpenChange?.(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
