import { AlertTriangle, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@/components/ui/item';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import type { Attack } from '@/schemas/rotation';
import { useRotationStore } from '@/store/useRotationStore';

import { AttackConfigurationDialog } from './AttackConfigurationDialog';

interface RotationAttackProps {
  attack: Attack;
  index: number;
  onRemove: (id: string) => void;
}

export const RotationAttack = ({ attack, index, onRemove }: RotationAttackProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const updateAttackParameter = useRotationStore(
    (state) => state.updateAttackParameter,
  );

  const displayName = attack.parentName
    ? `${attack.parentName}: ${attack.name}`
    : attack.name;

  const hasParameters = (attack.parameters?.length ?? 0) > 0;
  const showWarning = hasParameters && attack.parameterValue === undefined;

  const handleAttackClick = () => {
    if (hasParameters) {
      setIsDialogOpen(true);
    }
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Item
            variant="outline"
            size="sm"
            className={cn(
              'bg-card h-full transition-colors',
              hasParameters && 'hover:bg-accent/50 cursor-pointer',
            )}
            onClick={handleAttackClick}
          >
            <Text
              variant="tiny"
              className="text-muted-foreground w-6 shrink-0 font-mono"
            >
              {index + 1}.
            </Text>
            <ItemContent>
              <div className="flex items-center gap-1.5">
                <ItemTitle className="text-xs">{displayName}</ItemTitle>
                {showWarning && (
                  <AlertTriangle className="h-3 w-3 shrink-0 text-amber-500" />
                )}
              </div>
              {attack.characterName && (
                <ItemDescription className="text-[10px]">
                  {attack.characterName}
                </ItemDescription>
              )}
            </ItemContent>
            <ItemActions>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(attack.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </ItemActions>
          </Item>
        </TooltipTrigger>
        <TooltipContent side="right">
          <Text variant="tiny" className="font-bold">
            {attack.characterName} - {displayName}
          </Text>
          <Text variant="tiny">{attack.description}</Text>
          {showWarning && (
            <Text variant="tiny" className="mt-1 font-bold text-amber-500">
              Configuration required
            </Text>
          )}
          {hasParameters && !showWarning && (
            <Text variant="tiny" className="text-primary mt-1 font-bold">
              Value: {attack.parameterValue}
            </Text>
          )}
        </TooltipContent>
      </Tooltip>

      {isDialogOpen && (
        <AttackConfigurationDialog
          attack={attack}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSave={updateAttackParameter}
        />
      )}
    </>
  );
};
