import { isNil } from 'es-toolkit/predicate';
import { AlertTriangle, Maximize2 } from 'lucide-react';
import { useState } from 'react';

import { CapabilityHoverCard } from '@/components/common/CapabilityHoverCard';
import { CapabilityIconDisplay } from '@/components/common/CapabilityIcon';
import { EntityIconDisplay } from '@/components/common/EntityIcon';
import { ParameterConfigurationDialog } from '@/components/common/ParameterConfigurationDialog';
import { TrashButton } from '@/components/common/TrashButton';
import { BUFF_BACKGROUND_COLORS } from '@/components/rotation-builder/constants';
import { Button } from '@/components/ui/button';
import { Item, ItemActions, ItemMedia } from '@/components/ui/item';
import { Row } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';
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

interface BuffCanvasItemProperties {
  buff: DetailedModifierInstance;
  isDialogClickable: boolean;
  onRemove: (instanceId: string) => void;
  onOpenChange?: (isOpen: boolean) => void;
  stickyLeftOffset?: number;
  stickyRightOffset?: number;
}

interface BaseBuffCanvasItemProperties extends React.ComponentProps<'div'> {
  characterIconUrl?: string;
  iconUrl?: string;
  name?: string;
  actions?: React.ReactNode;
  stickyLeftOffset?: number;
  stickyRightOffset?: number;
}

export const BaseBuffCanvasItem = ({
  characterIconUrl,
  iconUrl,
  name,
  actions,
  className,
  stickyLeftOffset = 0,
  stickyRightOffset = 0,
  style,
  ...rest
}: BaseBuffCanvasItemProperties) => {
  const stickyLeftStyle =
    stickyLeftOffset > 0 ? { left: `${-stickyLeftOffset}px` } : undefined;
  const stickyRightStyle =
    stickyRightOffset > 0 ? { right: `${-stickyRightOffset}px` } : undefined;

  return (
    <Item
      {...rest}
      data-testid="buff-canvas-item"
      style={style}
      className={cn(
        'border-border relative flex h-12 flex-nowrap items-center justify-between gap-0 overflow-hidden border px-0 py-0 select-none',
        className,
      )}
    >
      {/* Counteract the grid item's translated X position so sticky chrome hugs the visible item edge. */}
      <Row
        align="center"
        data-testid="buff-canvas-item-sticky-left"
        style={stickyLeftStyle}
        className="gap-inset sticky left-0 z-10 min-w-0 flex-nowrap overflow-hidden px-6"
      >
        <ItemMedia>
          <EntityIconDisplay url={characterIconUrl} size="medium" />
        </ItemMedia>
        <ItemMedia>
          <CapabilityIconDisplay url={iconUrl} />
        </ItemMedia>
        <Text variant="caption" className="min-w-0 truncate">
          {name}
        </Text>
      </Row>
      {/* Right sticky: warning + actions */}
      <Row
        align="center"
        data-testid="buff-canvas-item-sticky-right"
        style={stickyRightStyle}
        className="gap-trim sticky right-0 z-10 min-w-0 flex-nowrap justify-end overflow-hidden px-6"
      >
        <ItemActions className="min-w-0 flex-nowrap overflow-hidden">
          {actions}
        </ItemActions>
      </Row>
    </Item>
  );
};

export const BuffCanvasItem = ({
  buff,
  isDialogClickable,
  onRemove,
  onOpenChange,
  stickyLeftOffset,
  stickyRightOffset,
}: BuffCanvasItemProperties) => {
  const updateBuffLayout = useStore((state) => state.updateBuffLayout);
  const { attacks } = useTeamAttackInstances();
  const alignment = useSelfBuffAlignment(buff);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleParameterConfigurationDialogOpenChange = (isOpen: boolean) => {
    setIsDialogOpen(isOpen);
    onOpenChange?.(isOpen);
  };

  // Generate styling and segments based on target and alignment
  const getItemBackgroundColorAndSegments = (): {
    backgroundColor?: string;
    segments: Array<AlignmentSegment>;
  } => {
    // Non-self buffs use standard colors
    if (buff.target !== Target.SELF) {
      return { backgroundColor: BUFF_BACKGROUND_COLORS[buff.target], segments: [] };
    }

    // Self buff styling based on alignment status
    switch (alignment.status) {
      case 'all-aligned': {
        // Fully aligned: solid fill
        return {
          backgroundColor: BUFF_BACKGROUND_COLORS[Target.SELF],
          segments: [],
        };
      }
      case 'all-misaligned': {
        // Fully misaligned: outline only
        return { backgroundColor: undefined, segments: [] };
      }
      case 'mixed': {
        // Partially aligned: render individual segments with rounded corners
        const alignmentSegments = getAlignmentSegments(alignment.columnAlignments);
        return {
          backgroundColor: undefined,
          segments: alignmentSegments,
        };
      }
      default: {
        return {
          backgroundColor: BUFF_BACKGROUND_COLORS[buff.target],
          segments: [],
        };
      }
    }
  };

  const { backgroundColor, segments } = getItemBackgroundColorAndSegments();
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
    <CapabilityHoverCard capability={buff} followCursor={!isDialogOpen}>
      <ParameterConfigurationDialog
        capability={buff}
        disabled={isDialogDisabled}
        buffedAttacks={buffedAttacks}
        open={isDialogOpen}
        onOpenChange={handleParameterConfigurationDialogOpenChange}
      >
        <BaseBuffCanvasItem
          characterIconUrl={buff.characterIconUrl}
          iconUrl={buff.iconUrl}
          name={buff.name}
          stickyLeftOffset={stickyLeftOffset}
          stickyRightOffset={stickyRightOffset}
          style={backgroundColor ? { backgroundColor } : undefined}
          actions={
            <>
              {shouldShowWarning && <AlertTriangle className="text-warning" />}
              <Button
                variant="ghost"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  updateBuffLayout(buff.instanceId, { x: 0, w: attacks.length });
                }}
              >
                <Maximize2 className="text-muted-foreground" />
              </Button>
              <TrashButton onRemove={() => onRemove(buff.instanceId)} />
            </>
          }
        >
          {segments.length > 0 ? (
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-md">
              {segments.map((segment, index) => (
                <div
                  key={index}
                  className="absolute inset-y-0"
                  style={{
                    backgroundColor: BUFF_BACKGROUND_COLORS[Target.SELF],
                    left: `${segment.start}%`,
                    width: `${segment.width}%`,
                  }}
                />
              ))}
            </div>
          ) : undefined}
        </BaseBuffCanvasItem>
      </ParameterConfigurationDialog>
    </CapabilityHoverCard>
  );
};
