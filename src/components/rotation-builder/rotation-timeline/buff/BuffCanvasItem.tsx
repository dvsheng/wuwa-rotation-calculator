import { isNil } from 'es-toolkit/predicate';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { ActivatableDialog } from '@/components/common/ActivatableDialog';
import { ParameterConfigurationForm } from '@/components/common/ParameterConfigurationForm';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogTrigger } from '@/components/ui/dialog';
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
    buff.parameters?.some(
      (parameter) =>
        (Number.isNaN(parameter.value) || isNil(parameter.value)) &&
        parameter.valueConfiguration?.some((v) => Number.isNaN(v) || isNil(v)),
    ) ?? false;

  return (
    <ActivatableDialog
      isOpen={isDialogOpen}
      setIsOpen={setIsDialogOpen}
      isDialogClickable={isBuffConfigurable && isDialogClickable}
      onOpenChange={onOpenChange}
    >
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
          <Text className="relative z-10 line-clamp-2 min-w-0 flex-1 text-left text-xs leading-tight">
            {buff.name}
          </Text>

          {/* Warning indicator */}
          {shouldShowWarning && (
            <AlertTriangle
              data-testid="alert-triangle"
              className="relative z-10 h-5 w-5 flex-shrink-0 text-amber-500"
            />
          )}

          {/* Delete button */}
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
      </DialogTrigger>

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
    </ActivatableDialog>
  );
};
