import { AlertTriangle, Trash2 } from 'lucide-react';

import { CanvasItem } from '@/components/common/CanvasItem';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/typography';
import { useCapabilityIcon, useEntityIcon } from '@/hooks/useIcons';
import type { DetailedAttackInstance } from '@/hooks/useTeamAttackInstances';
import { useRotationStore } from '@/store/useRotationStore';

interface AttackCanvasItemProperties {
  attack: DetailedAttackInstance;
  index: number;
  onRemove: (instanceId: string) => void;
}

export const AttackCanvasItem = ({
  attack,
  index,
  onRemove,
}: AttackCanvasItemProperties) => {
  const updateAttackParameters = useRotationStore(
    (state) => state.updateAttackParameters,
  );

  const { data: iconUrl } = useCapabilityIcon(attack.id, 'attack');
  const { data: characterIconUrl } = useEntityIcon(attack.characterId);

  return (
    <CanvasItem
      title={attack.name}
      subtitle={attack.characterName}
      description={attack.description}
      parameters={attack.parameters}
      onSaveParameters={(parameters) =>
        updateAttackParameters(attack.instanceId, parameters)
      }
    >
      {({ shouldShowWarning }) => (
        <div className="bg-card hover:bg-accent/50 relative flex h-full flex-col items-center overflow-hidden rounded-lg border px-4 pt-6 pb-3 transition-colors">
          {/* Index at top-left */}
          <Text
            variant="tiny"
            className="text-muted-foreground absolute top-1 left-1.5 font-mono"
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
            <div className="border-border flex aspect-square w-full max-w-[3.5rem] flex-shrink-0 items-center justify-center overflow-hidden rounded-full border bg-zinc-800">
              <img
                src={characterIconUrl}
                alt={attack.characterName}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          {/* Capability icon */}
          {iconUrl && (
            <div className="border-border mt-4 flex aspect-square w-full max-w-[4rem] flex-shrink items-center justify-center rounded-md border bg-zinc-700">
              <img
                src={iconUrl}
                alt={attack.name}
                className="h-full w-full object-contain p-0.5"
              />
            </div>
          )}

          {/* Attack name */}
          <Text className="mt-4 line-clamp-3 w-full flex-shrink-[2] text-center text-xs leading-tight font-medium">
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
      )}
    </CanvasItem>
  );
};
