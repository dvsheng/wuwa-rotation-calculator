import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { TimelinePanWrapper } from './TimelinePanWrapper';

vi.mock('react-zoom-pan-pinch', () => ({
  TransformWrapper: ({ children, onInit }: any) => {
    onInit?.();
    return children({});
  },
  TransformComponent: ({ children }: any) => children,
}));

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const setupRaf = () => {
  let now = 0;
  vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) => {
    const timer = setTimeout(() => {
      now += 16;
      callback(now);
    }, 16);
    return timer as unknown as number;
  });
  vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation((id) => {
    clearTimeout(id);
  });
};

const configureScrollElement = (scrollElement: HTMLDivElement) => {
  Object.defineProperty(scrollElement, 'clientWidth', {
    configurable: true,
    value: 100,
  });
  Object.defineProperty(scrollElement, 'scrollWidth', {
    configurable: true,
    value: 600,
  });
  Object.defineProperty(scrollElement, 'scrollLeft', {
    configurable: true,
    writable: true,
    value: 0,
  });
};

describe('TimelinePanWrapper', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders chevrons and children', () => {
    render(
      <TimelinePanWrapper>
        <div>Timeline Content</div>
      </TimelinePanWrapper>,
    );

    expect(screen.getByText('Timeline Content')).toBeInTheDocument();
    expect(screen.getByLabelText('Pan timeline left')).toBeInTheDocument();
    expect(screen.getByLabelText('Pan timeline right')).toBeInTheDocument();
  });

  it('pans right on chevron tap', async () => {
    const { container } = render(
      <TimelinePanWrapper step={120}>
        <div>Timeline Content</div>
      </TimelinePanWrapper>,
    );
    const scrollElement = container.querySelector(
      '[data-slot="scroll-area-viewport"]',
    ) as HTMLDivElement;
    configureScrollElement(scrollElement);

    const scrollByMock = vi.fn(
      (argument1?: ScrollToOptions | number, _argument2?: number) => {
        const left = typeof argument1 === 'number' ? argument1 : (argument1?.left ?? 0);
        scrollElement.scrollLeft += left;
        scrollElement.dispatchEvent(new Event('scroll'));
      },
    );
    scrollElement.scrollBy = scrollByMock as unknown as typeof scrollElement.scrollBy;

    act(() => {
      globalThis.dispatchEvent(new Event('resize'));
      scrollElement.dispatchEvent(new Event('scroll'));
    });

    const rightChevron = screen.getByLabelText('Pan timeline right');
    await waitFor(() => expect(rightChevron).toBeEnabled());

    act(() => {
      fireEvent.pointerDown(rightChevron);
      fireEvent.pointerUp(rightChevron);
    });

    expect(scrollByMock).toHaveBeenCalledWith({
      left: 120,
      behavior: 'smooth',
    });
  });

  it('continuously pans when holding a chevron', () => {
    vi.useFakeTimers();
    setupRaf();
    const { container } = render(
      <TimelinePanWrapper step={120}>
        <div>Timeline Content</div>
      </TimelinePanWrapper>,
    );
    const scrollElement = container.querySelector(
      '[data-slot="scroll-area-viewport"]',
    ) as HTMLDivElement;
    configureScrollElement(scrollElement);

    const scrollByMock = vi.fn(
      (argument1?: ScrollToOptions | number, _argument2?: number) => {
        const left = typeof argument1 === 'number' ? argument1 : (argument1?.left ?? 0);
        scrollElement.scrollLeft += left;
        scrollElement.dispatchEvent(new Event('scroll'));
      },
    );
    scrollElement.scrollBy = scrollByMock as unknown as typeof scrollElement.scrollBy;

    act(() => {
      globalThis.dispatchEvent(new Event('resize'));
      scrollElement.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(40);
    });

    const rightChevron = screen.getByLabelText('Pan timeline right');
    expect(rightChevron).toBeEnabled();

    act(() => {
      fireEvent.pointerDown(rightChevron);
      vi.advanceTimersByTime(260);
      fireEvent.pointerUp(rightChevron);
    });

    const autoCalls = scrollByMock.mock.calls.filter(
      ([firstArgument]) =>
        (firstArgument as ScrollToOptions | undefined)?.behavior === 'auto',
    );
    expect(autoCalls.length).toBeGreaterThan(0);
  });
});
