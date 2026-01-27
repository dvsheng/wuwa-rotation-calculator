import type { GridLayoutProps, Layout } from 'react-grid-layout';
import GridLayout, { useContainerWidth } from 'react-grid-layout';

import { Text } from '@/components/ui/typography';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import type { Attack, Capability } from '@/schemas/rotation';
import { CapabilitySchema } from '@/schemas/rotation';
import type { DetailedAttack } from '@/types/client/capability';

import { EmptyRotationState } from './EmptyRotationState';
import { RotationAttack } from './RotationAttack';

export interface RotationAttackSequenceProps {
  attacks: Array<DetailedAttack & Attack>;
  onRemove: (instanceId: string) => void;
  onReorder: (instanceIds: Array<Attack>) => void;
  onDrop: (attack: Capability, index: number) => void;
}

export const RotationAttackSequence = ({
  attacks,
  onRemove,
  onReorder,
  onDrop,
}: RotationAttackSequenceProps) => {
  const { width, containerRef, mounted } = useContainerWidth();
  const { createHandleDrop } = useDragAndDrop({
    schema: CapabilitySchema,
  });

  const handleLayoutChange = (layout: Layout) => {
    if (layout.length !== attacks.length) return;
    const newAttackInstanceIdOrder = [...layout]
      .sort((a, b) => a.y - b.y)
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

  const handleDrop = createHandleDrop((attack, item) => {
    onDrop(attack, item.y);
  });

  const layoutProps: Omit<GridLayoutProps, 'children'> = {
    width: Math.max(0, width - 32),
    gridConfig: {
      cols: 1,
      rowHeight: 64,
      margin: [0, 8] as [number, number],
      containerPadding: [0, 0] as [number, number],
    },
    layout: attacks.map((attack, index) => ({
      i: attack.instanceId,
      x: 0,
      y: index,
      w: 1,
      h: 1,
    })),
    style: { minHeight: '400px' },
    dropConfig: { enabled: true },
    dragConfig: { enabled: true },
    resizeConfig: { enabled: false },
    onDrop: handleDrop,
    onLayoutChange: handleLayoutChange,
  };

  return (
    <div
      ref={containerRef}
      className="bg-muted/5 border-muted-foreground/20 flex min-h-0 flex-1 flex-col rounded-xl border border-dashed"
    >
      <div className="bg-muted/30 flex items-center justify-between border-b px-4 py-2">
        <Text
          variant="small"
          className="text-muted-foreground font-bold tracking-wider uppercase"
        >
          Attack Sequence
        </Text>
        <Text variant="tiny" className="text-muted-foreground/60">
          {attacks.length} {attacks.length === 1 ? 'Attack' : 'Attacks'}
        </Text>
      </div>

      <div className="relative min-h-[400px] flex-1 overflow-hidden p-4">
        {attacks.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <EmptyRotationState />
          </div>
        )}

        {mounted && (
          <GridLayout {...layoutProps}>
            {attacks.map((attack, index) => (
              <div key={attack.instanceId} className="h-full w-full">
                <RotationAttack attack={attack} index={index} onRemove={onRemove} />
              </div>
            ))}
          </GridLayout>
        )}
      </div>
    </div>
  );
};
