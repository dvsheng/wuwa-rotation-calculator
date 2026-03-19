import attributeAero from '@/assets/attribute/icon/aero.webp';
import attributeElectro from '@/assets/attribute/icon/electro.webp';
import attributeFusion from '@/assets/attribute/icon/fusion.webp';
import attributeGlacio from '@/assets/attribute/icon/glacio.webp';
import attributeHavoc from '@/assets/attribute/icon/havoc.webp';
import attributeSpectro from '@/assets/attribute/icon/spectro.webp';
import guord from '@/assets/ui/gourd.webp';
import monster from '@/assets/ui/monster.webp';
import role from '@/assets/ui/role.webp';
import weapon from '@/assets/ui/weapon.webp';
import weaponBroadblade from '@/assets/weapon/Broadblade.webp';
import weaponGauntlets from '@/assets/weapon/Gauntlets.webp';
import weaponPistols from '@/assets/weapon/Pistols.webp';
import weaponRectifier from '@/assets/weapon/Rectifier.webp';
import weaponSword from '@/assets/weapon/Sword.webp';
import { cn } from '@/lib/utils';
import type { Attribute, WeaponType } from '@/types';

const ICON_MAP = {
  monster,
  role,
  guord,
  weapon,
} as const;

const ATTRIBUTE_ICON_MAP: Record<Exclude<Attribute, 'physical'>, string> = {
  aero: attributeAero,
  electro: attributeElectro,
  fusion: attributeFusion,
  glacio: attributeGlacio,
  havoc: attributeHavoc,
  spectro: attributeSpectro,
};

const WEAPON_TYPE_ICON_MAP: Record<WeaponType, string> = {
  Broadblade: weaponBroadblade,
  Gauntlets: weaponGauntlets,
  Pistols: weaponPistols,
  Rectifier: weaponRectifier,
  Sword: weaponSword,
};

interface AssetIconProperties {
  name: keyof typeof ICON_MAP;
  size?: number;
  className?: string;
}

const MONOCHROME_ICON_CLASSNAME =
  'shrink-0 object-contain brightness-0 dark:brightness-0 dark:invert';

export const AssetIcon = ({ name, size = 24, className }: AssetIconProperties) => (
  <img
    src={ICON_MAP[name]}
    width={size}
    height={size}
    alt={name}
    className={cn(MONOCHROME_ICON_CLASSNAME, className)}
  />
);

interface AttributeIconProperties {
  attribute: Exclude<Attribute, 'physical'>;
  size?: number;
  className?: string;
}

export const AttributeIcon = ({
  attribute,
  size = 24,
  className,
}: AttributeIconProperties) => (
  <img
    src={ATTRIBUTE_ICON_MAP[attribute]}
    width={size}
    height={size}
    alt={attribute}
    className={cn('shrink-0 object-contain', className)}
  />
);

interface WeaponTypeIconProperties {
  weaponType: WeaponType;
  size?: number;
  className?: string;
}

export const WeaponTypeIcon = ({
  weaponType,
  size = 24,
  className,
}: WeaponTypeIconProperties) => (
  <img
    src={WEAPON_TYPE_ICON_MAP[weaponType]}
    width={size}
    height={size}
    alt={weaponType}
    className={cn(MONOCHROME_ICON_CLASSNAME, className)}
  />
);
