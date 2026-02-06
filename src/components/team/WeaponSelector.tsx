import { GameImage } from '@/components/common/GameImage';
import type { FilterConfig } from '@/components/common/SelectionDialog';
import { SelectionDialog } from '@/components/common/SelectionDialog';
import { Row } from '@/components/ui/layout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCharacterList } from '@/hooks/useCharacterList';
import { useWeaponList } from '@/hooks/useWeaponList';
import { cn } from '@/lib/utils';
import type { ListWeaponsResponseItem } from '@/services/game-data/weapon/list-weapons';
import { useTeamStore } from '@/store/useTeamStore';
import { WeaponType } from '@/types';

import { AssetIcon } from '../common/AssetIcon';

interface WeaponSelectorProperties {
  index: number;
}

export const WeaponSelector = ({ index }: WeaponSelectorProperties) => {
  const characterId = useTeamStore((state) => state.team[index].id);
  const weapon = useTeamStore((state) => state.team[index].weapon);
  const setWeapon = useTeamStore((state) => state.setWeapon);
  const setRefine = useTeamStore((state) => state.setRefine);
  const { data: characterList = [] } = useCharacterList();
  const { data: weaponList = [] } = useWeaponList();

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
    <Row className="gap-2 px-1">
      <AssetIcon name="weapon" className="brightness-0 dark:invert" />
      <div className="flex-1">
        <SelectionDialog
          key={characterId}
          items={weaponList}
          value={weapon.id}
          onValueChange={(id) => setWeapon(index, id)}
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
                <div className="max-w-[120px] truncate text-sm font-bold">
                  {_weapon.name}
                </div>
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase',
                    _weapon.rarity === 5
                      ? 'bg-yellow-500/10 text-yellow-600'
                      : _weapon.rarity === 4
                        ? 'bg-purple-500/10 text-purple-600'
                        : 'bg-blue-500/10 text-blue-600',
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
      <div className="w-16 shrink-0">
        <Select
          value={String(weapon.refine)}
          onValueChange={(value) => setRefine(index, value)}
        >
          <SelectTrigger className="h-9 px-2">
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
      </div>
    </Row>
  );
};
