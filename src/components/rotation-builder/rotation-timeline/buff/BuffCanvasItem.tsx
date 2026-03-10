import { isNil } from 'es-toolkit/predicate';
import { AlertTriangle, Maximize2 } from 'lucide-react';

import { CapabilityIconDisplay } from '@/components/common/CapabilityIcon';
import { CapabilityTooltip } from '@/components/common/CapabilityTooltip';
import { EntityIconDisplay } from '@/components/common/EntityIcon';
import { ParameterConfigurationDialog } from '@/components/common/ParameterConfigurationDialog';
import { TrashButton } from '@/components/common/TrashButton';
import { Button } from '@/components/ui/button';
import { Item, ItemActions, ItemContent, ItemMedia } from '@/components/ui/item';
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

const TARGET_COLORS: Record<Target, string> = {
  [Target.SELF]: 'border-blue-400 bg-blue-100 text-foreground',
  [Target.TEAM]: 'border-green-400 bg-green-100 text-foreground',
  [Target.ACTIVE_CHARACTER]: 'border-amber-400 bg-amber-100 text-foreground',
  [Target.ENEMY]: 'border-red-400 bg-red-100 text-foreground',
};

/** Classes for self buffs without a solid fill (border + text, background transparent) */
const SELF_UNFILLED_CLASSES = 'border-blue-400 bg-transparent text-foreground';

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
  const updateBuffLayout = useStore((state) => state.updateBuffLayout);
  const { attacks } = useTeamAttackInstances();
  const alignment = useSelfBuffAlignment(buff);

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
        return { itemClassName: SELF_UNFILLED_CLASSES, segments: [] };
      }
      case 'mixed': {
        // Partially aligned: render individual segments with rounded corners
        const alignmentSegments = getAlignmentSegments(alignment.columnAlignments);
        return {
          itemClassName: SELF_UNFILLED_CLASSES,
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
    <ParameterConfigurationDialog
      capability={buff}
      onOpenChange={onOpenChange}
      isDialogClickable={!isDialogDisabled}
      buffedAttacks={buffedAttacks}
    >
      <CapabilityTooltip capability={buff}>
        <Item
          className={cn(
            'relative flex h-12 items-center py-0 select-none',
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
          {/* Sticky left: icons and name stay visible as the item scrolls */}
          <div className="sticky left-0 z-10 flex shrink-0 items-center gap-2 bg-inherit">
            <ItemMedia>
              <EntityIconDisplay url={buff.characterIconUrl} size="medium" />
            </ItemMedia>
            <ItemMedia>
              <CapabilityIconDisplay url={buff.iconUrl} size="medium" />
            </ItemMedia>
            <ItemContent className="text-xs">{buff.name}</ItemContent>
            {/* Warning indicator */}
            {shouldShowWarning && (
              <AlertTriangle
                data-testid="alert-triangle"
                className="size-5 shrink-0 text-amber-500"
              />
            )}
          </div>
          <div className="flex-1" />
          {/* Sticky right: actions stay visible as the item scrolls */}
          <ItemActions className="sticky right-0 z-10 bg-inherit">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground size-6 shrink-0"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                updateBuffLayout(buff.instanceId, { x: 0, w: attacks.length });
              }}
            >
              <Maximize2 className="size-3.5" />
            </Button>
            <TrashButton
              className="shrink-0"
              onRemove={() => onRemove(buff.instanceId)}
            />
          </ItemActions>
        </Item>
      </CapabilityTooltip>
    </ParameterConfigurationDialog>
  );
};
