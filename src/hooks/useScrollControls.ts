import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { RefCallback } from 'react';

export interface UseScrollControlsOptions {
  /** Scroll axis. Default: `'horizontal'` */
  direction?: 'horizontal' | 'vertical';
  /** Distance (px) scrolled on a single click. Default: `100` */
  clickDistance?: number;
  /** Distance (px) scrolled per hold interval tick. Default: `4` */
  holdDistance?: number;
  /**
   * How long (ms) the pointer must be held before entering continuous-scroll mode.
   * Default: `400`
   */
  holdDelay?: number;
  /** Interval (ms) between hold scroll ticks. Default: `16` (~60 fps) */
  holdInterval?: number;
}

export interface ScrollButtonProperties {
  onPointerDown: React.PointerEventHandler;
  onPointerUp: React.PointerEventHandler;
  onPointerLeave: React.PointerEventHandler;
  /** True when no scrolling is possible in this direction. */
  disabled: boolean;
}

export interface UseScrollControlsReturn {
  /** Attach to the scrollable element via the `ref` prop. */
  ref: RefCallback<HTMLElement>;
  /** True when scrolling toward the start (left / top) is possible. */
  canScrollBack: boolean;
  /** True when scrolling toward the end (right / bottom) is possible. */
  canScrollForward: boolean;
  /** Spread these props on the "scroll back" (←/↑) trigger element. */
  scrollBackProps: ScrollButtonProperties;
  /** Spread these props on the "scroll forward" (→/↓) trigger element. */
  scrollForwardProps: ScrollButtonProperties;
}

const applyScroll = (
  element: HTMLElement,
  delta: number,
  direction: 'horizontal' | 'vertical',
) => {
  if (direction === 'horizontal') {
    element.scrollLeft += delta;
  } else {
    element.scrollTop += delta;
  }
};

export const useScrollControls = ({
  direction = 'horizontal',
  clickDistance = 300,
  holdDistance = 12,
  holdDelay = 400,
  holdInterval = 16,
}: UseScrollControlsOptions = {}): UseScrollControlsReturn => {
  // Callback ref — calling setElement triggers a re-render so that subscribe
  // and the snapshot functions see the real element immediately after attachment.
  const [element, setElement] = useState<HTMLElement | undefined>();
  const reference: RefCallback<HTMLElement> = (node) => {
    setElement(node ?? undefined);
  };

  const holdTimerReference = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const holdTickReference = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined,
  );
  const isHoldActiveReference = useRef(false);
  // Guards against stray pointerup events after a non-primary-button pointerdown.
  const isPressActiveReference = useRef(false);

  // Keep mutable options in a ref so interval callbacks always see the latest
  // values without needing to be recreated.
  const optionsReference = useRef({
    clickDistance,
    holdDistance,
    holdDelay,
    holdInterval,
    direction,
  });
  useEffect(() => {
    optionsReference.current = {
      clickDistance,
      holdDistance,
      holdDelay,
      holdInterval,
      direction,
    };
  });

  // ---------------------------------------------------------------------------
  // Scroll-state subscription via useSyncExternalStore.
  // subscribe depends on `element` so React re-subscribes whenever the
  // target element changes.
  // ---------------------------------------------------------------------------

  const subscribe = (onStoreChange: () => void) => {
    if (!element) return () => {};
    element.addEventListener('scroll', onStoreChange, { passive: true });
    const ro = new ResizeObserver(onStoreChange);
    ro.observe(element);
    return () => {
      element.removeEventListener('scroll', onStoreChange);
      ro.disconnect();
    };
  };

  const getCanScrollBack = (): boolean => {
    if (!element) return false;
    return optionsReference.current.direction === 'horizontal'
      ? element.scrollLeft > 0
      : element.scrollTop > 0;
  };

  const getCanScrollForward = (): boolean => {
    if (!element) return false;
    const isHorizontal = optionsReference.current.direction === 'horizontal';
    const pos = isHorizontal ? element.scrollLeft : element.scrollTop;
    const max = isHorizontal
      ? element.scrollWidth - element.clientWidth
      : element.scrollHeight - element.clientHeight;
    return max > 0 && pos < max - 0.5;
  };

  const canScrollBack = useSyncExternalStore(subscribe, getCanScrollBack, () => false);
  const canScrollForward = useSyncExternalStore(
    subscribe,
    getCanScrollForward,
    () => false,
  );

  // ---------------------------------------------------------------------------
  // Scroll action
  // ---------------------------------------------------------------------------

  const doScroll = (delta: number) => {
    if (!element) return;
    applyScroll(element, delta, optionsReference.current.direction);
  };

  const clearTimers = () => {
    if (holdTimerReference.current !== undefined) {
      clearTimeout(holdTimerReference.current);
      holdTimerReference.current = undefined;
    }
    if (holdTickReference.current !== undefined) {
      clearInterval(holdTickReference.current);
      holdTickReference.current = undefined;
    }
  };

  // Clean up on unmount.
  useEffect(() => clearTimers, []);

  // ---------------------------------------------------------------------------
  // Event-handler factory
  // ---------------------------------------------------------------------------

  /** Build the event-handler props for one scroll direction. */
  const makeProperties = (
    sign: 1 | -1,
    canScroll: boolean,
  ): ScrollButtonProperties => ({
    disabled: !canScroll,

    onPointerDown: (event_) => {
      if (event_.button !== 0) return;
      isPressActiveReference.current = true;
      isHoldActiveReference.current = false;

      holdTimerReference.current = setTimeout(() => {
        isHoldActiveReference.current = true;
        holdTickReference.current = setInterval(() => {
          doScroll(sign * optionsReference.current.holdDistance);
        }, optionsReference.current.holdInterval);
      }, optionsReference.current.holdDelay);
    },

    onPointerUp: () => {
      if (!isPressActiveReference.current) return;
      const wasHolding = isHoldActiveReference.current;
      clearTimers();
      isPressActiveReference.current = false;
      isHoldActiveReference.current = false;
      if (!wasHolding) {
        // Short press — treat as a single click.
        doScroll(sign * optionsReference.current.clickDistance);
      }
    },

    onPointerLeave: () => {
      clearTimers();
      isPressActiveReference.current = false;
      isHoldActiveReference.current = false;
    },
  });

  return {
    ref: reference,
    canScrollBack,
    canScrollForward,
    scrollBackProps: makeProperties(-1, canScrollBack),
    scrollForwardProps: makeProperties(1, canScrollForward),
  };
};
