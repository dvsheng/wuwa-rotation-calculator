import { isNil } from 'es-toolkit/predicate';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { ActivatableDialog } from '@/components/common/ActivatableDialog';
import { CapabilityTooltip } from '@/components/common/CapabilityTooltip';
import { ParameterConfigurationForm } from '@/components/common/ParameterConfigurationForm';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Text } from '@/components/ui/typography';
import { useCapabilityIcon, useEntityIcon } from '@/hooks/useIcons';
import type { DetailedAttackInstance } from '@/hooks/useTeamAttackInstances';
import { useStore } from '@/store';

interface AttackCanvasItemProperties {
  attack: DetailedAttackInstance;
  index: number;
  onRemove: (instanceId: string) => void;
  isDialogClickable: boolean;
}

export const AttackCanvasItem = ({
  attack,
  index,
  onRemove,
  isDialogClickable,
}: AttackCanvasItemProperties) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const updateAttackParameters = useStore((state) => state.updateAttackParameters);

  const { data: iconUrl } = useCapabilityIcon(attack.id);
  const { data: characterIconUrl } = useEntityIcon(attack.characterId);

  const isAttackConfigurable = (attack.parameters?.length ?? 0) > 0;
  const shouldShowWarning =
    isAttackConfigurable &&
    (attack.parameters?.some(
      (parameter) => Number.isNaN(parameter.value) || isNil(parameter.value),
    ) ??
      false);

  return (
    <ActivatableDialog
      isOpen={isDialogOpen}
      setIsOpen={setIsDialogOpen}
      isDialogClickable={isAttackConfigurable && isDialogClickable}
    >
      <CapabilityTooltip capability={attack}>
        <DialogTrigger asChild>
          <div className="bg-card hover:bg-accent/50 relative flex h-full flex-col items-center overflow-hidden rounded-lg border px-4 pt-6 pb-3">
            {/* Index at top-left */}
            <Text
              variant="small"
              className="text-muted-foreground absolute top-1 left-1.5"
            >
              {index + 1}
            </Text>

            {/* Warning indicator at top-right */}
            {shouldShowWarning && (
              <AlertTriangle
                data-testid="alert-triangle"
                className="absolute top-1 right-1 h-5 w-5 text-amber-500"
              />
            )}

            {/* Character icon */}
            {characterIconUrl && (
              <img
                src={characterIconUrl}
                alt={attack.characterName}
                className="border-border max-w-20 items-center justify-center"
              />
            )}

            {/* Capability icon */}
            {iconUrl && (
              <div className="border-border mt-4 flex aspect-square w-full max-w-16 items-center justify-center rounded-md border bg-zinc-700">
                <img
                  src={iconUrl}
                  alt={attack.name}
                  className="h-full w-full object-contain p-0.5"
                />
              </div>
            )}

            {/* Attack name */}
            <Text className="mt-4 line-clamp-3 w-full text-center text-xs leading-tight">
              {attack.name}
            </Text>

            {/* Delete button at bottom-center */}
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive absolute bottom-1 left-1/2 h-6 w-6 -translate-x-1/2"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onRemove(attack.instanceId);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </DialogTrigger>
      </CapabilityTooltip>

      <DialogContent className="flex max-h-screen flex-col sm:max-w-lg">
        <ParameterConfigurationForm
          title={attack.name}
          description={attack.description}
          parameters={attack.parameters ?? []}
          onSubmit={(values) => {
            updateAttackParameters(attack.instanceId, values);
            setIsDialogOpen(false);
          }}
        />
      </DialogContent>
    </ActivatableDialog>
  );
};
