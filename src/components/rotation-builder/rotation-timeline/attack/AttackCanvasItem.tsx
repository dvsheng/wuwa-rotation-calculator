import { isNil } from 'es-toolkit/predicate';
import { AlertTriangle } from 'lucide-react';

import { CapabilityIcon } from '@/components/common/CapabilityIcon';
import { CapabilityTooltip } from '@/components/common/CapabilityTooltip';
import { CharacterIcon } from '@/components/common/CharacterIcon';
import { ParameterConfigurationDialog } from '@/components/common/ParameterConfigurationDialog';
import { TrashButton } from '@/components/common/TrashButton';
import { Text } from '@/components/ui/typography';
import { useEntityIcon } from '@/hooks/useIcons';
import type { DetailedAttackInstance } from '@/hooks/useTeamAttackInstances';

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
  const { data: characterIconUrl } = useEntityIcon(attack.characterId);

  const isAttackConfigurable = (attack.parameters?.length ?? 0) > 0;
  const shouldShowWarning =
    isAttackConfigurable &&
    (attack.parameters?.some(
      (parameter) => Number.isNaN(parameter.value) || isNil(parameter.value),
    ) ??
      false);

  return (
    <ParameterConfigurationDialog
      capability={attack}
      isDialogClickable={isAttackConfigurable && isDialogClickable}
    >
      <CapabilityTooltip capability={attack}>
        <div className="bg-card hover:bg-accent/50 p-compact relative flex h-full w-full flex-col items-center overflow-hidden rounded-lg border">
          {/* Index at top-left */}
          <Text as="span" variant="caption" className="absolute top-1 left-1">
            {index + 1}
          </Text>

          {/* Warning indicator at top-right */}
          {shouldShowWarning && (
            <AlertTriangle
              data-testid="alert-triangle"
              className="absolute top-1 right-1 h-5 w-5 text-amber-500"
            />
          )}
          {/* Character icon(s) */}
          {characterIconUrl && (
            <CharacterIcon characterEntityId={attack.characterId} size="large" />
          )}

          {/* Capability icon */}
          <div className="mt-2">
            <CapabilityIcon capabilityId={attack.id} size="medium" />
          </div>

          {/* Attack name */}
          <Text
            as="div"
            variant="caption"
            className="text-foreground mt-2 line-clamp-4 w-full text-center leading-tight"
          >
            {attack.name}
          </Text>

          {/* Delete button at bottom-center */}
          <TrashButton
            className="absolute bottom-1 left-1/2 -translate-x-1/2"
            onRemove={() => onRemove(attack.instanceId)}
            stopPropagation={true}
          />
        </div>
      </CapabilityTooltip>
    </ParameterConfigurationDialog>
  );
};
