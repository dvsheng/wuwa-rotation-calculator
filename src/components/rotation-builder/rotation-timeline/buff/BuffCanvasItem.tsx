import { isNil } from 'es-toolkit/predicate';
import { AlertTriangle, Maximize2 } from 'lucide-react';

import { CapabilityHoverCard } from '@/components/common/CapabilityHoverCard';
import { CapabilityIconDisplay } from '@/components/common/CapabilityIcon';
import { EntityIconDisplay } from '@/components/common/EntityIcon';
import { ParameterConfigurationDialog } from '@/components/common/ParameterConfigurationDialog';
import { TrashButton } from '@/components/common/TrashButton';
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

const TARGET_COLORS: Record<Target, string> = {
  [Target.SELF]: 'bg-blue-100',
  [Target.TEAM]: 'bg-green-100',
  [Target.ACTIVE_CHARACTER]: 'bg-amber-100',
  [Target.ENEMY]: 'bg-red-100',
};

interface BuffCanvasItemProperties {
  buff: DetailedModifierInstance;
  isDialogClickable: boolean;
  onRemove: (instanceId: string) => void;
  onOpenChange?: (isOpen: boolean) => void;
}

interface BaseBuffCanvasItemProperties {
  characterIconUrl?: string;
  iconUrl?: string;
  name?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const BaseBuffCanvasItem = ({
  characterIconUrl,
  iconUrl,
  name,
  children,
  actions,
  className,
}: BaseBuffCanvasItemProperties) => (
  <Item
    className={cn(
      'border-border relative flex h-12 items-center gap-0 border px-0 py-0 select-none',
      className,
    )}
  >
    {children}
    {/* Left sticky: icons + name */}
    <Row
      align="center"
      className="sticky left-0 h-full min-w-0 gap-4 overflow-hidden bg-inherit px-4"
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
    {/* Spacer */}
    <div className="flex-1" />
    {/* Right sticky: warning + actions */}
    <Row
      align="center"
      className="gap-inset sticky right-0 h-full shrink-0 bg-inherit px-4"
    >
      <ItemActions>{actions}</ItemActions>
    </Row>
  </Item>
);

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
        return { itemClassName: '', segments: [] };
      }
      case 'mixed': {
        // Partially aligned: render individual segments with rounded corners
        const alignmentSegments = getAlignmentSegments(alignment.columnAlignments);
        return {
          itemClassName: '',
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
      <CapabilityHoverCard capability={buff} followCursor={true}>
        <BaseBuffCanvasItem
          characterIconUrl={buff.characterIconUrl}
          iconUrl={buff.iconUrl}
          name={buff.name}
          className={itemClassName}
          actions={
            <>
              {shouldShowWarning && (
                <AlertTriangle
                  data-testid="alert-triangle"
                  className="size-5 shrink-0 text-amber-500"
                />
              )}
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
            </>
          }
        >
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
        </BaseBuffCanvasItem>
      </CapabilityHoverCard>
    </ParameterConfigurationDialog>
  );
};
