import type { ComponentPropsWithRef } from 'react';

import { AttributeIcon, WeaponTypeIcon } from '@/components/common/AssetIcon';
import { EntityIconDisplay } from '@/components/common/EntityIcon';
import { Row, Stack } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import type { ListEntityResponseItem } from '@/services/game-data';

interface EntitySelectorTileProperties extends ComponentPropsWithRef<'div'> {
  entity: ListEntityResponseItem;
  isSelected?: boolean;
  onClick?: () => void;
}

const RARITY_TILE_CLASSES: Record<number, string> = {
  5: 'bg-rarity-5-subtle bg-linear-to-br from-rarity-5/30 via-rarity-5-subtle to-rarity-5-strong/14',
  4: 'bg-rarity-4-subtle bg-linear-to-br from-rarity-4/30 via-rarity-4-subtle to-rarity-4-strong/14',
  3: 'bg-rarity-3-subtle bg-linear-to-br from-rarity-3/30 via-rarity-3-subtle to-rarity-3-strong/14',
  2: 'bg-rarity-2-subtle bg-linear-to-br from-rarity-2/30 via-rarity-2-subtle to-rarity-2-strong/14',
  1: 'bg-rarity-1-subtle bg-linear-to-br from-rarity-1/26 via-rarity-1-subtle to-rarity-1-strong/12',
};

export const EntitySelectorTile = ({
  entity,
  isSelected,
  onClick,
}: EntitySelectorTileProperties) => {
  const resolvedRarity = 'rarity' in entity ? entity.rarity : 1;

  return (
    <Stack
      gap="tight"
      className={cn(
        'p-compact border-border/55 hover:border-primary/40 size-36 items-center rounded-lg border shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:brightness-105',
        RARITY_TILE_CLASSES[resolvedRarity] ?? RARITY_TILE_CLASSES[1],
        isSelected && 'border-primary ring-primary/40 shadow-md ring-1',
      )}
      onClick={onClick}
    >
      <EntityIconDisplay url={entity.iconUrl} size="xlarge" className="shrink-0" />
      <Text as="div" variant="bodySm" className="wrap-2 text-center">
        {entity.name}
      </Text>
      <Row gap="tight" align="center" justify="center">
        {'cost' in entity && (
          <Text as="span" variant="caption">
            Cost {entity.cost}
          </Text>
        )}
        {'weaponType' in entity && <WeaponTypeIcon weaponType={entity.weaponType} />}
        {'attribute' in entity && entity.attribute !== 'physical' && (
          <AttributeIcon attribute={entity.attribute} />
        )}
      </Row>
    </Stack>
  );
};
