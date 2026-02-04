import guord from '@/assets/ui/gourd.webp';
import monster from '@/assets/ui/monster.webp';
import role from '@/assets/ui/role.webp';
import weapon from '@/assets/ui/weapon.webp';
import { cn } from '@/lib/utils';

const ICON_MAP = {
  monster,
  role,
  guord,
  weapon,
} as const;

interface AssetIconProperties {
  name: keyof typeof ICON_MAP;
  size?: number;
  className?: string;
}

export const AssetIcon = ({ name, size = 24, className }: AssetIconProperties) => (
  <img
    src={ICON_MAP[name]}
    width={size}
    height={size}
    alt={name}
    className={cn('shrink-0 object-contain brightness-0', className)}
  />
);
