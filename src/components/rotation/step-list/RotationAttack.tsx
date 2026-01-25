import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@/components/ui/item';
import { Text } from '@/components/ui/typography';
import type { Attack } from '@/schemas/rotation';

interface RotationAttackProps {
  attack: Attack;
  index: number;
  onRemove: (id: string) => void;
}

export const RotationAttack = ({ attack, index, onRemove }: RotationAttackProps) => {
  const displayName = attack.parentName
    ? `${attack.parentName}: ${attack.name}`
    : attack.name;

  return (
    <Item variant="outline" size="sm" className="bg-card h-full">
      <Text variant="tiny" className="text-muted-foreground w-6 shrink-0 font-mono">
        {index + 1}.
      </Text>
      <ItemContent>
        <ItemTitle className="text-xs">{displayName}</ItemTitle>
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
          onClick={() => onRemove(attack.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </ItemActions>
    </Item>
  );
};
