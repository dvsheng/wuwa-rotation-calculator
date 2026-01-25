import type React from 'react';
import type { Layout, LayoutItem } from 'react-grid-layout';
import { toast } from 'sonner';
import { z } from 'zod';

export const PALETTE_DRAG_TYPE = 'application/palette-item';

export interface UseDragAndDropOptions<T> {
  schema: z.ZodSchema<T>;
}

export const useDragAndDrop = <T>({ schema }: UseDragAndDropOptions<T>) => {
  const handleDragStart = (data: T, event: React.DragEvent) => {
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.dropEffect = 'copy';
    event.dataTransfer.setData('text/plain', '');
    const json = JSON.stringify(data);
    event.dataTransfer.setData(PALETTE_DRAG_TYPE, json);
    event.dataTransfer.setData('application/json', json);
  };

  const createHandleDrop = (
    onDrop: (data: T, item: LayoutItem, layout: Layout) => void,
  ) => {
    return (layout: Layout, item: LayoutItem | undefined, event: Event) => {
      const dragEvent = event as unknown as DragEvent;
      if (!item || !dragEvent.dataTransfer) return;

      try {
        const dataStr =
          dragEvent.dataTransfer.getData(PALETTE_DRAG_TYPE) ||
          dragEvent.dataTransfer.getData('application/json');

        if (dataStr === '') return;

        const rawData = JSON.parse(dataStr);
        const validatedData = schema.parse(rawData);

        onDrop(validatedData, item, layout);
      } catch (err) {
        if (err instanceof z.ZodError) {
          toast.error('Invalid item type for this area');
        } else {
          toast.error('Failed to drop item');
        }
      }
    };
  };

  return {
    handleDragStart,
    createHandleDrop,
  };
};
