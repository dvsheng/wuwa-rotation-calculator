import type { GridLayoutProps, Layout } from 'react-grid-layout';
import GridLayout, { useContainerWidth } from 'react-grid-layout';

import { Text } from '@/components/ui/typography';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { AttackSchema } from '@/schemas/rotation';
import type { Attack } from '@/schemas/rotation';

import { EmptyRotationState } from './EmptyRotationState';
import { RotationAttack } from './RotationAttack';

export interface RotationAttackSequenceProps {
  attacks: Array<Attack>;
  onRemove: (id: string) => void;
  onReorder: (attacks: Array<Attack>) => void;
  onDrop: (attack: Attack, index: number) => void;
}

export const RotationAttackSequence = ({
  attacks,
  onRemove,
  onReorder,
  onDrop,
}: RotationAttackSequenceProps) => {
  const { width, containerRef, mounted } = useContainerWidth();
  const { createHandleDrop } = useDragAndDrop({
    schema: AttackSchema,
  });

  const handleLayoutChange = (layout: Layout) => {
    // Prevent drops from triggering onReorder
    if (layout.length !== attacks.length) return;

    const newAttackIdOrder = [...layout]
      .sort((a, b) => a.y - b.y)
      .map((layoutItem) => layoutItem.i);
    const hasAttackOrderChanged = attacks.some(
      (attack, index) => attack.id !== newAttackIdOrder[index],
    );

    if (hasAttackOrderChanged) {
      const reordered = newAttackIdOrder.map((id) => attacks.find((a) => a.id === id)!);
      onReorder(reordered);
    }
  };

  const handleDrop = createHandleDrop((attack, item) => {
    onDrop(attack, item.y);
  });

  const gridConfig = {
    cols: 1,
    rowHeight: 64,
    margin: [0, 8] as [number, number],
    containerPadding: [0, 0] as [number, number],
  };

  const layout = attacks.map((attack, index) => ({
    i: attack.id,
    x: 0,
    y: index,
    w: 1,
    h: 1,
  }));

  // Subtract padding (p-4 = 16px * 2 = 32px) from container width
  const gridWidth = Math.max(0, width - 32);

  const layoutProps: Omit<GridLayoutProps, 'children'> = {
    width: gridWidth,
    gridConfig,
    layout,
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
              <div key={attack.id} className="h-full w-full">
                <RotationAttack attack={attack} index={index} onRemove={onRemove} />
              </div>
            ))}
          </GridLayout>
        )}
      </div>
    </div>
  );
};
