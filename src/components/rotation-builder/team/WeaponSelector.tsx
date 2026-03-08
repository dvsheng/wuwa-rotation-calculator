import { isNil } from 'es-toolkit/predicate';

import { AssetIcon } from '@/components/common/AssetIcon';
import { Row } from '@/components/ui/layout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEntityList } from '@/hooks/useEntityList';
import type { ListWeaponsResponseItem } from '@/services/game-data';
import { EntityType } from '@/services/game-data';
import { useStore } from '@/store';

import { EntitySelectionDialog } from './EntitySelectionDialog';

interface WeaponSelectorProperties {
  index: number;
}

export const WeaponSelector = ({ index }: WeaponSelectorProperties) => {
  const weapon = useStore((state) => state.team[index].weapon);
  const character = useStore((state) => state.team[index]);

  const setWeapon = useStore((state) => state.setWeapon);
  const clearForEntity = useStore((state) => state.clearForEntity);
  const setRefine = useStore((state) => state.setRefine);
  const { data: weaponList = [] } = useEntityList({ entityType: EntityType.WEAPON });
  const { data: characterList = [] } = useEntityList({
    entityType: EntityType.CHARACTER,
  });

  const characterWeaponType = characterList.find(
    (c) => c.id === character.id,
  )?.weaponType;

  const filteredWeaponList = isNil(characterWeaponType)
    ? weaponList
    : weaponList
        .filter((w) => w.weaponType === characterWeaponType)
        .map(({ weaponType, ...rest }) => ({ ...rest }) as ListWeaponsResponseItem);

  return (
    <Row className="selector-row">
      <AssetIcon name="weapon" className="selector-icon" />
      <EntitySelectionDialog
        items={filteredWeaponList}
        value={weapon.id}
        onValueChange={(id) => {
          if (id !== weapon.id) {
            clearForEntity(weapon.id);
            setWeapon(index, id);
          }
        }}
      />
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
