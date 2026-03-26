import { isNil } from 'es-toolkit/predicate';
import { AlertTriangle, InfoIcon, Maximize2, Trash2 } from 'lucide-react';
import { forwardRef, useState } from 'react';

import { CapabilityHoverCard } from '@/components/common/CapabilityHoverCard';
import { CapabilityIconDisplay } from '@/components/common/CapabilityIcon';
import { EntityIconDisplay } from '@/components/common/EntityIcon';
import { ParameterConfigurationDialog } from '@/components/common/ParameterConfigurationDialog';
import { TrashButton } from '@/components/common/TrashButton';
import { BUFF_BACKGROUND_COLORS } from '@/components/rotation-builder/constants';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Item, ItemActions, ItemMedia } from '@/components/ui/item';
import { Row } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';
import { useTeamAttackInstances } from '@/hooks/useTeamAttackInstances';
import type { DetailedModifierInstance } from '@/hooks/useTeamModifierInstances';
import { cn } from '@/lib/utils';
import { useStore } from '@/store';

interface BuffCanvasItemProperties {
  buff: DetailedModifierInstance;
  onRemove: (instanceId: string) => void;
  onOpenChange?: (isOpen: boolean) => void;
}

interface BaseBuffCanvasItemProperties extends React.ComponentProps<'div'> {
  characterIconUrl?: string;
  iconUrl?: string;
  name?: string;
  actions?: React.ReactNode;
}

export const BaseBuffCanvasItem = forwardRef<
  HTMLDivElement,
  BaseBuffCanvasItemProperties
>(({ characterIconUrl, iconUrl, name, actions, className, ...rest }, reference) => {
  return (
    <Item
      asChild
      variant="outline"
      className={cn(
        'draggable px-page h-12 flex-nowrap justify-between overflow-hidden',
        className,
      )}
    >
      <div {...rest} ref={reference} data-testid="buff-canvas-item">
        <Row gap="inset" className="min-w-0 overflow-hidden">
          <ItemMedia>
            <EntityIconDisplay url={characterIconUrl} size="medium" />
            <CapabilityIconDisplay url={iconUrl} />
          </ItemMedia>
          <Text variant="caption" className="min-w-0 truncate">
            {name}
          </Text>
        </Row>
        <ItemActions className="gap-inset text-muted-foreground min-w-0 overflow-hidden">
          {actions}
        </ItemActions>
      </div>
    </Item>
  );
});

BaseBuffCanvasItem.displayName = 'BaseBuffCanvasItem';

export const BuffCanvasItem = ({ buff, onRemove }: BuffCanvasItemProperties) => {
  const updateBuffLayout = useStore((state) => state.updateBuffLayout);
  const { attacks } = useTeamAttackInstances();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const isBuffConfigurable = buff.parameters.length > 0;
  const hasIncompleteConfiguration = buff.parameters.some((parameter) => {
    const valueMissing = isNil(parameter.value) || Number.isNaN(parameter.value);
    const configMissingOrIncomplete =
      !parameter.valueConfiguration ||
      parameter.valueConfiguration.some(
        (v) => v === 0 || isNil(v) || Number.isNaN(v),
      ) ||
      parameter.valueConfiguration.length !== buff.w;
    return valueMissing && configMissingOrIncomplete;
  });

  const openConfiguration = () => {
    setIsDialogOpen(true);
  };

  const maximizeBuff = () => {
    updateBuffLayout(buff.instanceId, { w: attacks.length });
  };

  const removeBuff = () => {
    onRemove(buff.instanceId);
  };

  return (
    <CapabilityHoverCard capability={buff} followCursor={true}>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <BaseBuffCanvasItem
            characterIconUrl={buff.characterIconUrl}
            iconUrl={buff.iconUrl}
            name={buff.name}
            style={{
              backgroundColor:
                BUFF_BACKGROUND_COLORS[buff.capabilityJson.modifiedStats[0].target],
            }}
            className={cn(hasIncompleteConfiguration && 'border-warning')}
            actions={
              <>
                {isBuffConfigurable && (
                  <ParameterConfigurationDialog
                    capability={buff}
                    buffedAttacks={attacks.slice(buff.x, buff.x + buff.w)}
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                  >
                    <Button variant="ghost" onClick={openConfiguration}>
                      {hasIncompleteConfiguration ? (
                        <AlertTriangle className="text-warning" />
                      ) : (
                        <InfoIcon />
                      )}
                    </Button>
                  </ParameterConfigurationDialog>
                )}
                <Button variant="ghost" onClick={maximizeBuff}>
                  <Maximize2 />
                </Button>
                <TrashButton onRemove={removeBuff} />
              </>
            }
          />
        </ContextMenuTrigger>
        <ContextMenuContent>
          {isBuffConfigurable && (
            <ContextMenuItem onSelect={openConfiguration}>
              <InfoIcon />
              Configure Parameters
            </ContextMenuItem>
          )}
          <ContextMenuItem onSelect={maximizeBuff}>
            <Maximize2 />
            Expand to full rotation
          </ContextMenuItem>
          <ContextMenuItem variant="destructive" onSelect={removeBuff}>
            <Trash2 />
            Remove buff
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </CapabilityHoverCard>
  );
};
