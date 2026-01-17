import { useDroppable } from '@dnd-kit/core';

import { ScrollArea } from '@/components/ui/scroll-area';

import { SortableItem } from '../../common/SortableItem';
import { ROTATION_LIST_ROOT_ID } from '../constants';
import type { RotationItem } from '../types';

import { EmptyRotationState } from './EmptyRotationState';
import { RotationStep } from './RotationStep';
import { SentinelRotationStep } from './SentinelRotationStep';

export interface RotationProps {
  items: Array<RotationItem>;
  onRemove: (id: string) => void;
}

export const RotationStepList = ({ items, onRemove }: RotationProps) => {
  const { setNodeRef } = useDroppable({
    id: ROTATION_LIST_ROOT_ID,
  });

  return (
    <div className="bg-muted/5 border-muted-foreground/20 flex min-h-0 flex-1 flex-col rounded-xl border border-dashed">
      <div ref={setNodeRef} className="flex min-h-[400px] flex-col space-y-3 p-6">
        <ScrollArea className="h-full flex-1">
          {items.map((item, index) => (
            <SortableItem key={item.id} id={item.id} data={{ item }}>
              <RotationStep item={item} index={index} onRemove={onRemove} />
            </SortableItem>
          ))}
          <SentinelRotationStep />
          {items.length === 0 && <EmptyRotationState />}
        </ScrollArea>
      </div>
    </div>
  );
};
