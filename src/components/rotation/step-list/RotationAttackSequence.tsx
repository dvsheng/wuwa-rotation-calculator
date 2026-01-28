import type { GridLayoutProps, Layout, LayoutItem } from 'react-grid-layout';
import GridLayout from 'react-grid-layout';

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Text } from '@/components/ui/typography';
import type { Attack } from '@/schemas/rotation';
import type { DetailedAttack } from '@/types/client/capability';

import type { SharedGridConfig } from '../types';

import { EmptyRotationState } from './EmptyRotationState';
import { RotationAttack } from './RotationAttack';

export interface RotationAttackSequenceProps {
  attacks: Array<DetailedAttack & Attack>;
  gridConfig: SharedGridConfig;
  onRemove: (instanceId: string) => void;
  onReorder: (instanceIds: Array<Attack>) => void;
  onDropAttack: (layout: Layout, item: LayoutItem | undefined, event: Event) => void;
}

export const RotationAttackSequence = ({
  attacks,
  gridConfig,
  onRemove,
  onReorder,
  onDropAttack,
}: RotationAttackSequenceProps) => {
  const handleLayoutChange = (layout: Layout) => {
    if (layout.length !== attacks.length) return;
    const newAttackInstanceIdOrder = [...layout]
      .sort((a, b) => a.x - b.x)
      .map((layoutItem) => layoutItem.i);
    const hasAttackOrderChanged = attacks.some(
      (attack, index) => attack.instanceId !== newAttackInstanceIdOrder[index],
    );
    if (hasAttackOrderChanged) {
      const newAttackOrder = newAttackInstanceIdOrder
        .map((id) => attacks.find((attack) => attack.id === id))
        .filter((attack) => attack !== undefined);
      onReorder(newAttackOrder);
    }
  };

  const layoutProps: Omit<GridLayoutProps, 'children'> = {
    width: gridConfig.width,
    gridConfig: {
      cols: gridConfig.cols,
      rowHeight: 64,
      margin: gridConfig.margin,
      containerPadding: gridConfig.containerPadding,
    },
    layout: attacks.map((attack, index) => ({
      i: attack.instanceId,
      x: index,
      y: 0,
      w: 1,
      h: 1,
    })),
    style: { minHeight: '80px', minWidth: gridConfig.width },
    dropConfig: { enabled: true },
    dragConfig: { enabled: true },
    resizeConfig: { enabled: false },
    onDrop: onDropAttack,
    onLayoutChange: handleLayoutChange,
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col border-t">
      <div className="flex items-center justify-between px-4 py-2">
        <Text className="text-sm font-semibold tracking-wider uppercase">
          Attack Sequence
        </Text>
        <Text variant="tiny" className="text-muted-foreground font-medium">
          {attacks.length} {attacks.length === 1 ? 'Attack' : 'Attacks'}
        </Text>
      </div>

      <div className="px-4 pb-4">
        <ScrollArea className="w-full">
          <div
            className="border-border/50 bg-muted/10 relative min-h-[80px] rounded-lg border transition-colors"
            style={{ minWidth: gridConfig.width }}
          >
            {attacks.length === 0 && <EmptyRotationState />}

            <GridLayout {...layoutProps}>
              {attacks.map((attack, index) => (
                <div key={attack.instanceId} className="h-full w-full">
                  <RotationAttack attack={attack} index={index} onRemove={onRemove} />
                </div>
              ))}
            </GridLayout>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
};
