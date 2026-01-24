import { SearchableSelect } from '@/components/common/SearchableSelect';
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
import { useTeamStore } from '@/store/useTeamStore';
import type { WeaponType } from '@/types';

import { AssetIcon } from '../common/AssetIcon';

interface WeaponSelectorProps {
  index: number;
}

export const WeaponSelector = ({ index }: WeaponSelectorProps) => {
  const character = useTeamStore((state) => state.team[index]);
  const setWeapon = useTeamStore((state) => state.setWeapon);
  const setRefine = useTeamStore((state) => state.setRefine);

  const { data: characterList } = useCharacterList();

  const selectedCharacterData = characterList.find((c) => c.name === character.name);
  const { data: weaponList } = useWeaponList(
    selectedCharacterData?.weaponType as WeaponType,
  );

  return (
    <Row className="gap-2 px-1">
      <AssetIcon name="weapon" className="brightness-0 dark:invert" />
      <div className="flex-1">
        <SearchableSelect
          options={weaponList}
          value={character.weapon.name}
          onChange={(val) => {
            const weapon = weaponList.find((w) => w.name === val);
            if (weapon) {
              setWeapon(index, weapon.id, weapon.name);
            }
          }}
          placeholder="Select weapon"
          groupBy="rarity"
          groupOrder="desc"
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
