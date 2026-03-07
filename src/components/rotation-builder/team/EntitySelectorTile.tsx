import { AttributeIcon, WeaponTypeIcon } from '@/components/common/AssetIcon';
import { EntityIconDisplay } from '@/components/common/EntityIcon';
import { Row, Stack } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import type { ListEntitiesResponse } from '@/services/game-data';

import { ATTRIBUTE_COLORS } from './constants';

interface EntitySelectorTileProperties {
  entity: ListEntitiesResponse[number];
  isSelected?: boolean;
}

const RARITY_CLASSES: Record<number, string> = {
  5: 'bg-rarity-5/10',
  4: 'bg-rarity-4/10',
  3: 'bg-rarity-3/10',
};

export const EntitySelectorTile = ({
  entity,
  isSelected,
}: EntitySelectorTileProperties) => (
  <Stack
    gap="compact"
    className={cn(
      'hover:bg-accent hover:border-primary/50 p-component border-border size-36 items-center rounded-lg border',
      isSelected && 'border-primary ring-primary bg-accent ring-1',
    )}
    style={
      'attribute' in entity
        ? { borderLeft: `4px solid ${ATTRIBUTE_COLORS[entity.attribute]}` }
        : undefined
    }
  >
    <EntityIconDisplay url={entity.iconUrl} size="xlarge" className="shrink-0" />
    <Text as="div" variant="small" className="wrap-2 text-foreground max-w-30">
      {entity.name}
    </Text>
    <Row gap="tight" align="center" justify="center">
      {'rarity' in entity && (
        <Text
          as="span"
          variant="caption"
          className={cn(
            'px-tight py-tight text-foreground rounded-full',
            RARITY_CLASSES[entity.rarity],
          )}
        >
          {entity.rarity}★
        </Text>
      )}
      {'cost' in entity && (
        <Text
          as="span"
          variant="caption"
          className={cn(
            'px-tight py-tight text-foreground rounded-full',
            RARITY_CLASSES[entity.cost === 4 ? 5 : entity.cost === 3 ? 4 : 3],
          )}
        >
          Cost {entity.cost}
        </Text>
      )}
      {'weaponType' in entity && (
        <WeaponTypeIcon weaponType={entity.weaponType} size={20} />
      )}
      {'attribute' in entity && entity.attribute !== 'physical' && (
        <AttributeIcon attribute={entity.attribute} size={20} />
      )}
    </Row>
  </Stack>
);
