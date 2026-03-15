import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/layout';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface TimelinePanWrapperProperties {
  children: React.ReactNode;
  className?: string;
  step?: number;
}

const CHEVRON_HOLD_PAN_SPEED = 1800;

export const TimelinePanWrapper = ({
  children,
  className,
  step = 280,
}: TimelinePanWrapperProperties) => {
  const scrollReference = useRef<HTMLDivElement>(null);
  const holdTimeoutReference = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const holdFrameReference = useRef<number | undefined>(undefined);
  const holdLastFrameTimeReference = useRef<number | undefined>(undefined);
  const holdDirectionReference = useRef<'left' | 'right' | undefined>(undefined);
  const [canPanLeft, setCanPanLeft] = useState(false);
  const [canPanRight, setCanPanRight] = useState(false);

  const updatePanButtons = () => {
    const scrollElement = scrollReference.current;
    if (!scrollElement) return;

    const maxScrollLeft = Math.max(
      0,
      scrollElement.scrollWidth - scrollElement.clientWidth,
    );
    setCanPanLeft(scrollElement.scrollLeft > 0);
    setCanPanRight(scrollElement.scrollLeft < maxScrollLeft - 1);
  };

  useEffect(() => {
    const scrollElement = scrollReference.current;
    if (!scrollElement) return;

    requestAnimationFrame(updatePanButtons);
    scrollElement.addEventListener('scroll', updatePanButtons, { passive: true });

    const resizeObserver = new ResizeObserver(updatePanButtons);
    resizeObserver.observe(scrollElement);
    const mutationObserver = new MutationObserver(() => {
      requestAnimationFrame(updatePanButtons);
    });
    mutationObserver.observe(scrollElement, {
      childList: true,
      subtree: true,
      attributes: true,
    });
    window.addEventListener('resize', updatePanButtons);

    return () => {
      scrollElement.removeEventListener('scroll', updatePanButtons);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', updatePanButtons);
    };
  }, []);

  useEffect(() => {
    requestAnimationFrame(updatePanButtons);
  }, [children]);

  const stopContinuousPan = () => {
    holdDirectionReference.current = undefined;
    if (holdTimeoutReference.current) {
      clearTimeout(holdTimeoutReference.current);
      holdTimeoutReference.current = undefined;
    }
    if (holdFrameReference.current) {
      cancelAnimationFrame(holdFrameReference.current);
      holdFrameReference.current = undefined;
    }
    holdLastFrameTimeReference.current = undefined;
  };

  useEffect(() => stopContinuousPan, []);

  const pan = (direction: 'left' | 'right', smooth = true) => {
    const scrollElement = scrollReference.current;
    if (!scrollElement) return;
    scrollElement.scrollBy({
      left: direction === 'left' ? -step : step,
      behavior: smooth ? 'smooth' : 'auto',
    });
  };

  const startContinuousPan = (direction: 'left' | 'right') => {
    const speed = CHEVRON_HOLD_PAN_SPEED;
    holdDirectionReference.current = direction;

    const tick = (timestamp: number) => {
      if (holdDirectionReference.current !== direction) return;
      const scrollElement = scrollReference.current;
      if (!scrollElement) return;
      const lastTimestamp = holdLastFrameTimeReference.current ?? timestamp;
      const deltaMs = Math.min(40, timestamp - lastTimestamp);
      holdLastFrameTimeReference.current = timestamp;
      const distance = (speed * deltaMs) / 1000;
      scrollElement.scrollBy({
        left: direction === 'left' ? -distance : distance,
        behavior: 'auto',
      });
      holdFrameReference.current = requestAnimationFrame(tick);
    };

    holdFrameReference.current = requestAnimationFrame(tick);
  };

  const handlePointerDown = (direction: 'left' | 'right') => {
    stopContinuousPan();
    holdTimeoutReference.current = setTimeout(() => {
      startContinuousPan(direction);
    }, 180);
  };

  const handlePointerEnd = (direction: 'left' | 'right') => {
    const wasLongPress = holdDirectionReference.current === direction;
    stopContinuousPan();
    if (!wasLongPress) pan(direction);
  };

  return (
    <Container
      className={cn('relative flex min-h-0 flex-col overflow-hidden', className)}
    >
      <Button
        type="button"
        variant="outline"
        size="icon-lg"
        className="h-icon-lg absolute top-1/2 left-2 z-20 -translate-y-1/2 shadow-sm"
        onPointerDown={() => handlePointerDown('left')}
        onPointerUp={() => handlePointerEnd('left')}
        onPointerLeave={stopContinuousPan}
        onPointerCancel={stopContinuousPan}
        disabled={!canPanLeft}
        aria-label="Pan timeline left"
      >
        <ChevronLeft />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon-lg"
        className="h-icon-lg absolute top-1/2 right-2 z-20 -translate-y-1/2 shadow-sm"
        onPointerDown={() => handlePointerDown('right')}
        onPointerUp={() => handlePointerEnd('right')}
        onPointerLeave={stopContinuousPan}
        onPointerCancel={stopContinuousPan}
        disabled={!canPanRight}
        aria-label="Pan timeline right"
      >
        <ChevronRight />
      </Button>
      <ScrollArea
        orientation="horizontal"
        className="min-h-0 flex-1"
        viewportRef={scrollReference}
        viewportClassName="h-full w-full"
      >
        <div className="px-panel flex min-h-full min-w-max flex-col">{children}</div>
      </ScrollArea>
    </Container>
  );
};
