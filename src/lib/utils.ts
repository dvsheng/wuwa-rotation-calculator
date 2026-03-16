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
] as const;

export const getChartColorByIndex = (index: number) => {
  const base = index % BASE_COLORS.length;
  const cycle = Math.floor(index / BASE_COLORS.length);

  if (cycle === 0) return BASE_COLORS[base];

  const hueShift = cycle * 18; // rotate hue each cycle
  return `oklch(from ${BASE_COLORS[base]} l c calc(h + ${hueShift}))`;
};
