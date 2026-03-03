import { isNil } from 'es-toolkit/predicate';
import { AlertTriangle } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ActivatableDialog } from '@/components/common/ActivatableDialog';
import { CapabilityIcon } from '@/components/common/CapabilityIcon';
import { CapabilityTooltip } from '@/components/common/CapabilityTooltip';
import { CharacterIcon } from '@/components/common/CharacterIcon';
import { ParameterConfigurationForm } from '@/components/common/ParameterConfigurationForm';
import { TrashButton } from '@/components/common/TrashButton';
import { DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Text } from '@/components/ui/typography';
import { useEntityIcon } from '@/hooks/useIcons';
import type { DetailedAttackInstance } from '@/hooks/useTeamAttackInstances';
import { useTeamDetails } from '@/hooks/useTeamDetails';
import { useStore } from '@/store';

interface AttackCanvasItemProperties {
  attack: DetailedAttackInstance;
  index: number;
  onRemove: (instanceId: string) => void;
  isDialogClickable: boolean;
}

/** Stacked row of character icons for all team members contributing Tune Break damage. */
const TuneBreakCharacterStack = () => {
  const { attacks } = useTeamDetails();

  const contributors = useMemo(() => {
    const seen = new Set<number>();
    return attacks.filter((a) => {
      if (!a.isTuneBreakAttack) return false;
      if (seen.has(a.characterId)) return false;
      seen.add(a.characterId);
      return true;
    });
  }, [attacks]);

  return (
    <div className="flex items-center justify-center">
      {contributors.map((c, index) => (
        <div key={c.characterId} className={index > 0 ? '-ml-3' : undefined}>
          <CharacterIcon characterEntityId={c.characterId} size="medium" />
        </div>
      ))}
    </div>
  );
};

export const AttackCanvasItem = ({
  attack,
  index,
  onRemove,
  isDialogClickable,
}: AttackCanvasItemProperties) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const updateAttackParameters = useStore((state) => state.updateAttackParameters);

  const { data: characterIconUrl } = useEntityIcon(attack.characterId);

  const isTuneBreak = attack.isTuneBreakAttack;
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
          <div className="bg-card hover:bg-accent/50 relative flex h-full flex-col items-center overflow-hidden rounded-lg border p-2">
            {/* Index at top-left */}
            <Text
              variant="small"
              className="text-muted-foreground absolute top-1 left-1"
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
            {/* Character icon(s) */}
            {isTuneBreak ? (
              <TuneBreakCharacterStack />
            ) : (
              characterIconUrl && (
                <CharacterIcon characterEntityId={attack.characterId} size="large" />
              )
            )}

            {/* Capability icon */}
            <div className="mt-2">
              <CapabilityIcon capabilityId={attack.id} size="medium" />
            </div>

            {/* Attack name */}
            <Text className="mt-2 line-clamp-4 w-full text-center text-xs leading-tight">
              {attack.name}
            </Text>

            {/* Delete button at bottom-center */}
            <TrashButton
              className="absolute bottom-1 left-1/2 -translate-x-1/2"
              onRemove={() => onRemove(attack.instanceId)}
              stopPropagation={true}
            />
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
