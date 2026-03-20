import { isNil } from 'es-toolkit/predicate';
import { AlertTriangle, InfoIcon, Maximize2 } from 'lucide-react';
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

export const BaseBuffCanvasItem = ({
  characterIconUrl,
  iconUrl,
  name,
  actions,
  className,
  ...rest
}: BaseBuffCanvasItemProperties) => {
  return (
    <Item
      {...rest}
      data-testid="buff-canvas-item"
      variant="outline"
      className={cn(
        'draggable px-page h-12 flex-nowrap justify-between overflow-hidden',
        className,
      )}
    >
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
    </Item>
  );
};

export const BuffCanvasItem = ({ buff, onRemove }: BuffCanvasItemProperties) => {
  const updateBuffLayout = useStore((state) => state.updateBuffLayout);
  const { attacks } = useTeamAttackInstances();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const isBuffConfigurable = buff.parameters && buff.parameters.length > 0;
  const hasIncompleteConfiguration =
    buff.parameters?.some((parameter) => {
      const valueMissing = isNil(parameter.value) || Number.isNaN(parameter.value);
      const configMissingOrIncomplete =
        !parameter.valueConfiguration ||
        parameter.valueConfiguration.some(
          (v) => v === 0 || isNil(v) || Number.isNaN(v),
        ) ||
        parameter.valueConfiguration.length !== buff.w;
      return valueMissing && configMissingOrIncomplete;
    }) ?? false;
  return (
    <CapabilityHoverCard capability={buff} followCursor={true}>
      <BaseBuffCanvasItem
        characterIconUrl={buff.characterIconUrl}
        iconUrl={buff.iconUrl}
        name={buff.name}
        style={{ backgroundColor: BUFF_BACKGROUND_COLORS[buff.target] }}
        className={cn(hasIncompleteConfiguration && 'border-warning')}
        actions={
          <>
            {isBuffConfigurable && (
              <ParameterConfigurationDialog
                capability={buff}
                disabled={!isBuffConfigurable}
                buffedAttacks={attacks.slice(buff.x, buff.x + buff.w)}
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
              >
                <Button variant="ghost" onClick={() => setIsDialogOpen(true)}>
                  {hasIncompleteConfiguration ? (
                    <AlertTriangle className="text-warning" />
                  ) : (
                    <InfoIcon />
                  )}
                </Button>
              </ParameterConfigurationDialog>
            )}
            <Button
              variant="ghost"
              onClick={() => {
                updateBuffLayout(buff.instanceId, { w: attacks.length });
              }}
            >
              <Maximize2 />
            </Button>
            <TrashButton onRemove={() => onRemove(buff.instanceId)} />
          </>
        }
      ></BaseBuffCanvasItem>
    </CapabilityHoverCard>
  );
};
