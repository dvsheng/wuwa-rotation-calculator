import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs));
}

const BASE_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
  'var(--chart-7)',
] as const;

export const getChartColorByIndex = (index: number) => {
  const base = index % BASE_COLORS.length;
  const cycle = Math.floor(index / BASE_COLORS.length);

  return cycle === 0
    ? BASE_COLORS[base]
    : `oklch(from ${BASE_COLORS[base]} l c calc(h + ${cycle * BASE_COLORS.length}))`;
};
