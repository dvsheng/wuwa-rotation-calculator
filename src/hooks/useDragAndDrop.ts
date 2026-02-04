import { useId } from 'react';
import type React from 'react';
import type { Layout, LayoutItem } from 'react-grid-layout';
import { toast } from 'sonner';
import { z } from 'zod';

export const PALETTE_DRAG_TYPE = 'application/palette-item';
export const PALETTE_UUID_TYPE = 'application/x-palette-uuid';

export interface UseDragAndDropOptions<T> {
  schema: z.ZodSchema<T>;
}

export const useDragAndDrop = <T>({ schema }: UseDragAndDropOptions<T>) => {
  const instanceId = useId();

  const handleDragStart = (data: T, event: React.DragEvent) => {
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.dropEffect = 'copy';
    event.dataTransfer.setData('text/plain', '');
    const json = JSON.stringify(data);
    event.dataTransfer.setData(PALETTE_DRAG_TYPE, json);
    event.dataTransfer.setData('application/json', json);
    event.dataTransfer.setData(PALETTE_UUID_TYPE, instanceId);
  };

  const createHandleDrop = (
    onDrop: (data: T, item: LayoutItem, layout: Layout) => void,
  ) => {
    return (layout: Layout, item: LayoutItem | undefined, event: Event) => {
      const dragEvent = event as unknown as DragEvent;
      if (!item || !dragEvent.dataTransfer) return;

      const droppedUuid = dragEvent.dataTransfer.getData(PALETTE_UUID_TYPE);
      if (droppedUuid !== instanceId) {
        toast.error('Invalid item type for this area');
        return;
      }

      try {
        const dataString =
          dragEvent.dataTransfer.getData(PALETTE_DRAG_TYPE) ||
          dragEvent.dataTransfer.getData('application/json');

        if (dataString === '') return;

        const rawData = JSON.parse(dataString);
        const validatedData = schema.parse(rawData);

        onDrop(validatedData, item, layout);
      } catch (error) {
        if (error instanceof z.ZodError) {
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
