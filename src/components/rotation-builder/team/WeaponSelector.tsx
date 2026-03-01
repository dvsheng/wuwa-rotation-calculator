import { AssetIcon } from '@/components/common/AssetIcon';
import { GameImage } from '@/components/common/GameImage';
import { SelectionDialog } from '@/components/common/SelectionDialog';
import type { FilterConfig } from '@/components/common/SelectionDialog';
import { Row } from '@/components/ui/layout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEntityList } from '@/hooks/useEntityList';
import { cn } from '@/lib/utils';
import { EntityType } from '@/services/game-data';
import type { ListWeaponsResponseItem } from '@/services/game-data';
import { useStore } from '@/store';
import { WeaponType } from '@/types';

interface WeaponSelectorProperties {
  index: number;
}

export const WeaponSelector = ({ index }: WeaponSelectorProperties) => {
  const characterId = useStore((state) => state.team[index].id);
  const weapon = useStore((state) => state.team[index].weapon);
  const setWeapon = useStore((state) => state.setWeapon);
  const clearForEntity = useStore((state) => state.clearForEntity);
  const setRefine = useStore((state) => state.setRefine);
  const { data: characterList = [] } = useEntityList({
    entityType: EntityType.CHARACTER,
  });
  const { data: weaponList = [] } = useEntityList({ entityType: EntityType.WEAPON });

  const selectedCharacterData = characterList.find((c) => c.id === characterId);
  const weaponTypeFilter: FilterConfig<ListWeaponsResponseItem> = {
    label: 'Type',
    options: Object.values(WeaponType).map((type) => ({ value: type, label: type })),
    getValue: (_weapon) => _weapon.weaponType,
    defaultValue: selectedCharacterData?.weaponType,
  };
  const rarityFilter: FilterConfig<ListWeaponsResponseItem> = {
    label: 'Rarity',
    options: [5, 4, 3].map((r) => ({ value: r, label: `${r}★` })),
    getValue: (_weapon) => _weapon.rarity,
  };

  return (
    <Row className="selector-row">
      <AssetIcon name="weapon" className="selector-icon" />
      <div className="selector-main">
        <SelectionDialog
          key={characterId}
          items={weaponList}
          value={weapon.id}
          onValueChange={(id) => {
            if (id !== weapon.id) clearForEntity(weapon.id);
            setWeapon(index, id);
          }}
          title="Select Weapon"
          placeholder="Select weapon"
          searchPlaceholder="Search weapons..."
          filters={[weaponTypeFilter, rarityFilter]}
          renderItem={(_weapon) => (
            <>
              <div className="relative flex h-14 w-14 items-center justify-center">
                <GameImage
                  entity="weapon"
                  type="icon"
                  id={_weapon.id}
                  alt={_weapon.name}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="space-y-1">
                <div className="max-w-30 truncate text-sm">{_weapon.name}</div>
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-xs uppercase',
                    _weapon.rarity === 5
                      ? 'text-foreground bg-rarity-5/10'
                      : _weapon.rarity === 4
                        ? 'text-foreground bg-rarity-4/10'
                        : 'text-foreground bg-rarity-3/10',
                  )}
                >
                  {_weapon.rarity}★
                </span>
              </div>
            </>
          )}
          sortFn={(a, b) => {
            // Sort by rarity descending (5* before 4*)
            if (a.rarity !== b.rarity) {
              return b.rarity - a.rarity;
            }
            // Then by name
            return a.name.localeCompare(b.name);
          }}
          gridCols={{ default: 2, md: 3 }}
          triggerClassName="h-9"
        />
      </div>
      <Select
        value={String(weapon.refine)}
        onValueChange={(value) => setRefine(index, value)}
      >
        <SelectTrigger className="selector-secondary">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {[1, 2, 3, 4, 5].map((r) => (
            <SelectItem key={r} value={String(r)}>
              R{r}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Row>
  );
};
