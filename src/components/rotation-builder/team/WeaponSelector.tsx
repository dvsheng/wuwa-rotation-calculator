import { isNil } from 'es-toolkit/predicate';

import { EntityIconDisplay } from '@/components/common/EntityIcon';
import { useEntityList } from '@/hooks/useEntityList';
import type { ListWeaponsResponseItem } from '@/services/game-data';
import { EntityType } from '@/services/game-data';
import { useStore } from '@/store';

import { EntitySelectionDialog } from './EntitySelectionDialog';
import { SecondarySelector, SelectorLayout } from './StyledBaseSelector';

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

  const selectedWeapon = weaponList.find((w) => w.id === weapon.id);

  const characterWeaponType = characterList.find(
    (c) => c.id === character.id,
  )?.weaponType;

  const filteredWeaponList = isNil(characterWeaponType)
    ? weaponList
    : weaponList
        .filter((w) => w.weaponType === characterWeaponType)
        .map(({ weaponType, ...rest }) => ({ ...rest }) as ListWeaponsResponseItem);

  return (
    <SelectorLayout
      icon={<EntityIconDisplay url={selectedWeapon?.iconUrl} size="large" />}
    >
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
      <SecondarySelector
        value={String(weapon.refine)}
        onValueChange={(value) => setRefine(index, value)}
        options={[1, 2, 3, 4, 5].map((r) => ({
          value: String(r),
          label: `R${r}`,
        }))}
      />
    </SelectorLayout>
  );
};
