import type { Data } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import React from 'react';

interface DraggableItemProps<T> {
  id: string;
  children: React.ReactNode;
  data?: Data<T>;
}

export const DraggableItem = <T,>({ id, children, data }: DraggableItemProps<T>) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id, data });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="w-full min-w-0"
    >
      {children}
    </div>
  );
};
