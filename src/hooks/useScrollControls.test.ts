import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useScrollControls } from './useScrollControls';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/**
 * Creates a mock scrollable div whose scrollLeft property clamps to
 * [0, scrollWidth - clientWidth] and fires a 'scroll' event on change,
 * mirroring real browser behaviour.
 */
function createScrollableElement({
  scrollLeft = 0,
  scrollWidth = 500,
  clientWidth = 200,
}: {
  scrollLeft?: number;
  scrollWidth?: number;
  clientWidth?: number;
} = {}) {
  const element = document.createElement('div');
  let _scrollLeft = scrollLeft;
  const maxScroll = scrollWidth - clientWidth;

  Object.defineProperty(element, 'scrollLeft', {
    get: () => _scrollLeft,
    set: (v: number) => {
      _scrollLeft = Math.max(0, Math.min(v, maxScroll));
      element.dispatchEvent(new Event('scroll'));
    },
    configurable: true,
  });
  Object.defineProperty(element, 'scrollWidth', {
    get: () => scrollWidth,
    configurable: true,
  });
  Object.defineProperty(element, 'clientWidth', {
    get: () => clientWidth,
    configurable: true,
  });

  return element;
}

function createVerticalScrollableElement({
  scrollTop = 0,
  scrollHeight = 500,
  clientHeight = 200,
}: {
  scrollTop?: number;
  scrollHeight?: number;
  clientHeight?: number;
} = {}) {
  const element = document.createElement('div');
  let _scrollTop = scrollTop;
  const maxScroll = scrollHeight - clientHeight;

  Object.defineProperty(element, 'scrollTop', {
    get: () => _scrollTop,
    set: (v: number) => {
      _scrollTop = Math.max(0, Math.min(v, maxScroll));
      element.dispatchEvent(new Event('scroll'));
    },
    configurable: true,
  });
  Object.defineProperty(element, 'scrollHeight', {
    get: () => scrollHeight,
    configurable: true,
  });
  Object.defineProperty(element, 'clientHeight', {
    get: () => clientHeight,
    configurable: true,
  });

  return element;
}

/** Synthetic pointer-down event for the primary button. */
const primaryPointerDown = { button: 0 } as React.PointerEvent;
const pointerUp = {} as React.PointerEvent;
const pointerLeave = {} as React.PointerEvent;

// ---------------------------------------------------------------------------
// ResizeObserver mock (jsdom does not implement it)
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Helper: render the hook and attach a mock element via the returned ref.
// ---------------------------------------------------------------------------
function renderWithElement(
  scrollableElement: HTMLElement,
  options?: Parameters<typeof useScrollControls>[0],
) {
  const rendered = renderHook(() => useScrollControls(options));
  act(() => {
    rendered.result.current.ref(scrollableElement);
  });
  return rendered;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useScrollControls', () => {
  describe('initial scroll state', () => {
    it('reports canScrollForward=true and canScrollBack=false when at the start', () => {
      const element = createScrollableElement({ scrollLeft: 0 });
      const { result } = renderWithElement(element);

      expect(result.current.canScrollBack).toBe(false);
      expect(result.current.canScrollForward).toBe(true);
    });

    it('reports canScrollBack=true and canScrollForward=false when at the end', () => {
      const element = createScrollableElement({ scrollLeft: 300 }); // 500 - 200 = 300 max
      const { result } = renderWithElement(element);

      expect(result.current.canScrollBack).toBe(true);
      expect(result.current.canScrollForward).toBe(false);
    });

    it('reports both true when scrolled into the middle', () => {
      const element = createScrollableElement({ scrollLeft: 150 });
      const { result } = renderWithElement(element);

      expect(result.current.canScrollBack).toBe(true);
      expect(result.current.canScrollForward).toBe(true);
    });

    it('reports both false when the element has no overflow', () => {
      const element = createScrollableElement({
        scrollLeft: 0,
        scrollWidth: 200,
        clientWidth: 200,
      });
      const { result } = renderWithElement(element);

      expect(result.current.canScrollBack).toBe(false);
      expect(result.current.canScrollForward).toBe(false);
    });
  });

  describe('scroll state updates on scroll event', () => {
    it('updates canScrollBack to true after scrolling forward', () => {
      const element = createScrollableElement({ scrollLeft: 0 });
      const { result } = renderWithElement(element);

      expect(result.current.canScrollBack).toBe(false);

      act(() => {
        element.scrollLeft = 100;
      });

      expect(result.current.canScrollBack).toBe(true);
    });

    it('updates canScrollForward to false after scrolling to the end', () => {
      const element = createScrollableElement({ scrollLeft: 0 });
      const { result } = renderWithElement(element);

      act(() => {
        element.scrollLeft = 300; // max
      });

      expect(result.current.canScrollForward).toBe(false);
    });
  });

  describe('disabled props', () => {
    it('scrollBackProps.disabled is true when at the start', () => {
      const element = createScrollableElement({ scrollLeft: 0 });
      const { result } = renderWithElement(element);

      expect(result.current.scrollBackProps.disabled).toBe(true);
      expect(result.current.scrollForwardProps.disabled).toBe(false);
    });

    it('scrollForwardProps.disabled is true when at the end', () => {
      const element = createScrollableElement({ scrollLeft: 300 });
      const { result } = renderWithElement(element);

      expect(result.current.scrollBackProps.disabled).toBe(false);
      expect(result.current.scrollForwardProps.disabled).toBe(true);
    });
  });

  describe('click scroll (short press)', () => {
    it('scrolls forward by clickDistance on pointerUp without hold', () => {
      const element = createScrollableElement({ scrollLeft: 0 });
      const { result } = renderWithElement(element, { clickDistance: 80 });

      act(() => {
        result.current.scrollForwardProps.onPointerDown(primaryPointerDown);
        result.current.scrollForwardProps.onPointerUp(pointerUp);
      });

      expect(element.scrollLeft).toBe(80);
    });

    it('scrolls back by clickDistance on pointerUp without hold', () => {
      const element = createScrollableElement({ scrollLeft: 200 });
      const { result } = renderWithElement(element, { clickDistance: 80 });

      act(() => {
        result.current.scrollBackProps.onPointerDown(primaryPointerDown);
        result.current.scrollBackProps.onPointerUp(pointerUp);
      });

      expect(element.scrollLeft).toBe(120);
    });

    it('does not scroll backward past 0', () => {
      const element = createScrollableElement({ scrollLeft: 40 });
      const { result } = renderWithElement(element, { clickDistance: 100 });

      act(() => {
        result.current.scrollBackProps.onPointerDown(primaryPointerDown);
        result.current.scrollBackProps.onPointerUp(pointerUp);
      });

      expect(element.scrollLeft).toBe(0);
    });

    it('does not scroll forward past the max', () => {
      const element = createScrollableElement({ scrollLeft: 280 }); // max = 300
      const { result } = renderWithElement(element, { clickDistance: 100 });

      act(() => {
        result.current.scrollForwardProps.onPointerDown(primaryPointerDown);
        result.current.scrollForwardProps.onPointerUp(pointerUp);
      });

      expect(element.scrollLeft).toBe(300);
    });

    it('ignores non-primary button (button !== 0)', () => {
      const element = createScrollableElement({ scrollLeft: 0 });
      const { result } = renderWithElement(element, { clickDistance: 100 });

      act(() => {
        result.current.scrollForwardProps.onPointerDown({
          button: 2,
        } as React.PointerEvent);
        result.current.scrollForwardProps.onPointerUp(pointerUp);
      });

      // pointerUp fires without a preceding valid pointerDown, so no scroll
      expect(element.scrollLeft).toBe(0);
    });
  });

  describe('hold scroll (continuous)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('starts continuous scrolling after holdDelay and scrolls by holdDistance each tick', () => {
      const element = createScrollableElement({ scrollLeft: 0 });
      const { result } = renderWithElement(element, {
        holdDelay: 400,
        holdDistance: 10,
        holdInterval: 50,
      });

      act(() => {
        result.current.scrollForwardProps.onPointerDown(primaryPointerDown);
      });

      // Before holdDelay nothing should have scrolled
      act(() => {
        vi.advanceTimersByTime(399);
      });
      expect(element.scrollLeft).toBe(0);

      // After holdDelay the interval fires
      act(() => {
        vi.advanceTimersByTime(1); // now at exactly 400ms — hold starts
        vi.advanceTimersByTime(50); // first tick
      });
      expect(element.scrollLeft).toBe(10);

      act(() => {
        vi.advanceTimersByTime(50); // second tick
      });
      expect(element.scrollLeft).toBe(20);
    });

    it('does NOT perform a click scroll on pointerUp when hold was active', () => {
      const element = createScrollableElement({ scrollLeft: 0 });
      const { result } = renderWithElement(element, {
        holdDelay: 400,
        holdDistance: 5,
        holdInterval: 50,
        clickDistance: 100,
      });

      act(() => {
        result.current.scrollForwardProps.onPointerDown(primaryPointerDown);
        vi.advanceTimersByTime(500); // trigger hold + a couple of ticks
      });

      const scrolledDuringHold = element.scrollLeft;
      expect(scrolledDuringHold).toBeGreaterThan(0);

      act(() => {
        result.current.scrollForwardProps.onPointerUp(pointerUp);
      });

      // Should not add a further clickDistance jump
      expect(element.scrollLeft).toBe(scrolledDuringHold);
    });

    it('stops scrolling on pointerUp', () => {
      const element = createScrollableElement({ scrollLeft: 0 });
      const { result } = renderWithElement(element, {
        holdDelay: 200,
        holdDistance: 5,
        holdInterval: 50,
      });

      act(() => {
        result.current.scrollForwardProps.onPointerDown(primaryPointerDown);
        vi.advanceTimersByTime(350); // hold active, a few ticks
      });

      const posAtRelease = element.scrollLeft;

      act(() => {
        result.current.scrollForwardProps.onPointerUp(pointerUp);
        vi.advanceTimersByTime(200); // more time passes
      });

      // scrollLeft should be frozen after release
      expect(element.scrollLeft).toBe(posAtRelease);
    });

    it('stops scrolling on pointerLeave', () => {
      const element = createScrollableElement({ scrollLeft: 0 });
      const { result } = renderWithElement(element, {
        holdDelay: 200,
        holdDistance: 5,
        holdInterval: 50,
      });

      act(() => {
        result.current.scrollForwardProps.onPointerDown(primaryPointerDown);
        vi.advanceTimersByTime(350);
      });

      const posAtLeave = element.scrollLeft;

      act(() => {
        result.current.scrollForwardProps.onPointerLeave(pointerLeave);
        vi.advanceTimersByTime(200);
      });

      expect(element.scrollLeft).toBe(posAtLeave);
    });

    it('cancels hold timer on pointerLeave before holdDelay', () => {
      const element = createScrollableElement({ scrollLeft: 0 });
      const { result } = renderWithElement(element, {
        holdDelay: 400,
        holdDistance: 5,
        holdInterval: 50,
        clickDistance: 100,
      });

      act(() => {
        result.current.scrollForwardProps.onPointerDown(primaryPointerDown);
        vi.advanceTimersByTime(200); // still within holdDelay
        result.current.scrollForwardProps.onPointerLeave(pointerLeave);
        vi.advanceTimersByTime(500); // well past holdDelay, but timer was cancelled
      });

      // No click scroll (cancelled by leave) and no hold scroll
      expect(element.scrollLeft).toBe(0);
    });
  });

  describe('vertical direction', () => {
    it('scrolls scrollTop instead of scrollLeft', () => {
      const element = createVerticalScrollableElement({ scrollTop: 0 });
      const { result } = renderWithElement(element, {
        direction: 'vertical',
        clickDistance: 60,
      });

      act(() => {
        result.current.scrollForwardProps.onPointerDown(primaryPointerDown);
        result.current.scrollForwardProps.onPointerUp(pointerUp);
      });

      expect(element.scrollTop).toBe(60);
    });

    it('reports canScrollBack=false and canScrollForward=true at the top', () => {
      const element = createVerticalScrollableElement({ scrollTop: 0 });
      const { result } = renderWithElement(element, { direction: 'vertical' });

      expect(result.current.canScrollBack).toBe(false);
      expect(result.current.canScrollForward).toBe(true);
    });
  });

  describe('unattached (no element)', () => {
    it('returns canScrollBack=false and canScrollForward=false before ref is attached', () => {
      const { result } = renderHook(() => useScrollControls());

      expect(result.current.canScrollBack).toBe(false);
      expect(result.current.canScrollForward).toBe(false);
    });
  });
});
