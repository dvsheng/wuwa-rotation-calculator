import { renderHook } from '@testing-library/react';
import { toast } from 'sonner';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { PALETTE_DRAG_TYPE, useDragAndDrop } from './useDragAndDrop';

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('useDragAndDrop', () => {
  const TestSchema = z.object({
    id: z.string(),
    type: z.literal('test'),
  });

  type TestData = z.infer<typeof TestSchema>;

  it('handleDragStart sets correct data on dataTransfer', () => {
    const { result } = renderHook(() => useDragAndDrop({ schema: TestSchema }));
    const mockData: TestData = { id: '123', type: 'test' };
    const setData = vi.fn();
    const mockEvent = {
      dataTransfer: {
        setData,
        effectAllowed: '',
        dropEffect: '',
      },
    } as unknown as React.DragEvent;

    result.current.handleDragStart(mockData, mockEvent);

    expect(setData).toHaveBeenCalledWith('text/plain', '');
    expect(setData).toHaveBeenCalledWith(PALETTE_DRAG_TYPE, JSON.stringify(mockData));
    expect(setData).toHaveBeenCalledWith('application/json', JSON.stringify(mockData));
    expect(mockEvent.dataTransfer.effectAllowed).toBe('copy');
  });

  it('createHandleDrop calls onDrop for valid data', () => {
    const { result } = renderHook(() => useDragAndDrop({ schema: TestSchema }));
    const onDrop = vi.fn();
    const handleDrop = result.current.createHandleDrop(onDrop);

    const validData: TestData = { id: '123', type: 'test' };
    const mockEvent = {
      dataTransfer: {
        getData: (type: string) =>
          type === PALETTE_DRAG_TYPE ? JSON.stringify(validData) : '',
      },
    } as unknown as Event;

    const mockLayoutItem = { i: '123', x: 0, y: 0, w: 1, h: 1 };
    handleDrop([], mockLayoutItem, mockEvent);

    expect(onDrop).toHaveBeenCalledWith(validData, mockLayoutItem, []);
  });

  it('createHandleDrop shows toast error for invalid schema data', () => {
    const { result } = renderHook(() => useDragAndDrop({ schema: TestSchema }));
    const onDrop = vi.fn();
    const handleDrop = result.current.createHandleDrop(onDrop);

    const invalidData = { id: '123', type: 'wrong-type' };
    const mockEvent = {
      dataTransfer: {
        getData: (type: string) =>
          type === PALETTE_DRAG_TYPE ? JSON.stringify(invalidData) : '',
      },
    } as unknown as Event;

    handleDrop([], { i: '123', x: 0, y: 0, w: 1, h: 1 }, mockEvent);

    expect(onDrop).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Invalid item type for this area');
  });

  it('createHandleDrop shows toast error for non-JSON data', () => {
    const { result } = renderHook(() => useDragAndDrop({ schema: TestSchema }));
    const onDrop = vi.fn();
    const handleDrop = result.current.createHandleDrop(onDrop);

    const mockEvent = {
      dataTransfer: {
        getData: () => 'not-json',
      },
    } as unknown as Event;

    handleDrop([], { i: '123', x: 0, y: 0, w: 1, h: 1 }, mockEvent);

    expect(onDrop).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Failed to drop item');
  });
});
