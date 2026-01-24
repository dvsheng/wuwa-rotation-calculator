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
import { useTeamStore } from '@/store/useTeamStore';
import type { WeaponType } from '@/types';

import { AssetIcon } from '../common/AssetIcon';

interface WeaponSelectorProps {
  index: number;
}

type WeaponListItem = {
  id: string;
  name: string;
  weaponType: WeaponType;
  rarity: number;
};

export const WeaponSelector = ({ index }: WeaponSelectorProps) => {
  const character = useTeamStore((state) => state.team[index]);
  const setWeapon = useTeamStore((state) => state.setWeapon);
  const setRefine = useTeamStore((state) => state.setRefine);

  const { data: characterList } = useCharacterList();

  const selectedCharacterData = characterList.find((c) => c.name === character.name);
  const { data: weaponList = [] } = useWeaponList(
    selectedCharacterData?.weaponType as WeaponType,
  );

  // Rarity filter
  const rarityFilter: FilterConfig<WeaponListItem> = {
    label: 'Rarity',
    options: [5, 4, 3].map((r) => ({ value: r, label: `${r}★` })),
    getValue: (weapon) => weapon.rarity,
  };

  return (
    <Row className="gap-2 px-1">
      <AssetIcon name="weapon" className="brightness-0 dark:invert" />
      <div className="flex-1">
        <SelectionDialog
          items={weaponList}
          selectedItemName={character.weapon.name}
          onSelect={(id, name) => {
            setWeapon(index, id as string, name);
          }}
          title="Select Weapon"
          placeholder="Select weapon"
          searchPlaceholder="Search weapons..."
          filters={[rarityFilter]}
          renderItem={(weapon) => (
            <>
              <div className="relative flex h-14 w-14 items-center justify-center">
                <GameImage
                  entity="weapon"
                  type="icon"
                  id={weapon.id}
                  alt={weapon.name}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="space-y-1">
                <div className="max-w-[120px] truncate text-sm font-bold">
                  {weapon.name}
                </div>
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase',
                    weapon.rarity === 5
                      ? 'bg-yellow-500/10 text-yellow-600'
                      : weapon.rarity === 4
                        ? 'bg-purple-500/10 text-purple-600'
                        : 'bg-blue-500/10 text-blue-600',
                  )}
                >
                  {weapon.rarity}★
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
          value={String(character.weapon.refine)}
          onValueChange={(val) => setRefine(index, parseInt(val))}
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
