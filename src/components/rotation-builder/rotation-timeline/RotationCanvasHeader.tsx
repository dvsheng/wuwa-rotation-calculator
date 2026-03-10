import { Sword } from 'lucide-react';

import { DashboardSectionHeader } from '@/components/common/DashboardSectionHeader';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store';

export const RotationCanvasHeader = () => {
  const attacks = useStore((state) => state.attacks);
  const buffs = useStore((state) => state.buffs);
  const clearAll = useStore((state) => state.clearAll);

  return (
    <DashboardSectionHeader
      title="Rotation"
      subtitle={`(${attacks.length} ${attacks.length === 1 ? 'attack' : 'attacks'}, ${buffs.length} ${buffs.length === 1 ? 'buff' : 'buffs'})`}
      description="Drag attacks and buffs from the palette to build your timeline."
      icon={<Sword />}
      action={
        <Button variant="destructive" size="xs" onClick={clearAll}>
          Clear All
        </Button>
      }
    />
  );
};
