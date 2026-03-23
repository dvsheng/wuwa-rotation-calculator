import type { ComponentPropsWithRef } from 'react';

import { AttributeIcon, WeaponTypeIcon } from '@/components/common/AssetIcon';
import { EntityIconDisplay } from '@/components/common/EntityIcon';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
import { Row } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import type { EntityListRow } from '@/services/game-data';

interface EntitySelectorTileProperties extends ComponentPropsWithRef<'div'> {
  entity: EntityListRow;
  onClick?: () => void;
}

const RARITY_BORDER_CLASSES: Record<number, string> = {
  5: 'border-l-4 border-l-rarity-5',
  4: 'border-l-4 border-l-rarity-4',
  3: 'border-l-4 border-l-rarity-3',
  2: 'border-l-4 border-l-rarity-2',
  1: 'border-l-4 border-l-rarity-1',
};

export const EntitySelectorTile = ({
  entity,
  onClick,
}: EntitySelectorTileProperties) => {
  const resolvedRarity = entity.rank ?? 1;

  return (
    <Item
      className={cn(RARITY_BORDER_CLASSES[resolvedRarity] ?? RARITY_BORDER_CLASSES[1])}
      variant="outline"
      onClick={onClick}
    >
      <Row gap="inset">
        <ItemMedia>
          <EntityIconDisplay url={entity.iconUrl} size="xlarge" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{entity.name}</ItemTitle>
          <ItemDescription className="flex">
            {entity.cost !== undefined && (
              <Text as="span" variant="caption">
                Cost {entity.cost}
              </Text>
            )}
            {entity.weaponType !== undefined && (
              <WeaponTypeIcon weaponType={entity.weaponType} />
            )}
            {entity.attribute !== undefined && entity.attribute !== 'physical' && (
              <AttributeIcon attribute={entity.attribute} />
            )}
          </ItemDescription>
        </ItemContent>
      </Row>
    </Item>
  );
};
