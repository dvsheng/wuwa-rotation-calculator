import { renderHook } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { PALETTE_DRAG_TYPE, PALETTE_UUID_TYPE, useDragAndDrop } from './useDragAndDrop';

const MOCK_INSTANCE_ID = 'test-instance-id';

// Mock React's useId
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useId: () => MOCK_INSTANCE_ID,
  };
});

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('useDragAndDrop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
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
        getData: (type: string) => {
          if (type === PALETTE_DRAG_TYPE) return JSON.stringify(validData);
          if (type === PALETTE_UUID_TYPE) return MOCK_INSTANCE_ID;
          return '';
        },
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
        getData: (type: string) => {
          if (type === PALETTE_DRAG_TYPE) return JSON.stringify(invalidData);
          if (type === PALETTE_UUID_TYPE) return MOCK_INSTANCE_ID;
          return '';
        },
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
        getData: (type: string) => {
          if (type === PALETTE_UUID_TYPE) return MOCK_INSTANCE_ID;
          return 'not-json';
        },
      },
    } as unknown as Event;

    handleDrop([], { i: '123', x: 0, y: 0, w: 1, h: 1 }, mockEvent);

    expect(onDrop).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Failed to drop item');
  });

  it('createHandleDrop ignores drop when UUID does not match', () => {
    const { result } = renderHook(() => useDragAndDrop({ schema: TestSchema }));
    const onDrop = vi.fn();
    const handleDrop = result.current.createHandleDrop(onDrop);

    const validData: TestData = { id: '123', type: 'test' };
    const mockEvent = {
      dataTransfer: {
        getData: (type: string) => {
          if (type === PALETTE_DRAG_TYPE) return JSON.stringify(validData);
          if (type === PALETTE_UUID_TYPE) return 'different-instance-id';
          return '';
        },
      },
    } as unknown as Event;

    handleDrop([], { i: '123', x: 0, y: 0, w: 1, h: 1 }, mockEvent);

    expect(onDrop).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });
});
