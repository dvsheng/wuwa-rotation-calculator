import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

// Shared gap scale aligned to semantic spacing tokens
const gapVariants = {
  none: '',
  tight: 'gap-tight',
  compact: 'gap-compact',
  component: 'gap-component',
  panel: 'gap-panel',
  page: 'gap-page',
} as const;

// Stack — flex column container
const stackVariants = cva('flex flex-col', {
  variants: {
    gap: gapVariants,
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
    },
    fullWidth: {
      true: 'w-full',
    },
  },
  defaultVariants: { gap: 'none' },
});

type StackProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof stackVariants>;

const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ className, gap, align, fullWidth, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(stackVariants({ gap, align, fullWidth }), className)}
      {...props}
    />
  ),
);
Stack.displayName = 'Stack';

// Row — flex row container
const rowVariants = cva('flex', {
  variants: {
    gap: gapVariants,
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      baseline: 'items-baseline',
      stretch: 'items-stretch',
    },
    justify: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
    },
    fullWidth: {
      true: 'w-full',
    },
    wrap: {
      true: 'flex-wrap',
    },
  },
  defaultVariants: { gap: 'none', align: 'center' },
});

type RowProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof rowVariants>;

const Row = React.forwardRef<HTMLDivElement, RowProps>(
  ({ className, gap, align, justify, fullWidth, wrap, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(rowVariants({ gap, align, justify, fullWidth, wrap }), className)}
      {...props}
    />
  ),
);
Row.displayName = 'Row';

// Container — page-level wrapper
const containerVariants = cva('mx-auto w-full', {
  variants: {
    padding: {
      none: '',
      page: 'p-page',
    },
  },
  defaultVariants: { padding: 'none' },
});

type ContainerProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof containerVariants>;

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(containerVariants({ padding }), className)}
      {...props}
    />
  ),
);
Container.displayName = 'Container';

// Grid — generic grid container
const gridVariants = cva('grid w-full', {
  variants: { gap: gapVariants },
  defaultVariants: { gap: 'panel' },
});

type GridProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof gridVariants>;

const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ className, gap, ...props }, ref) => (
    <div ref={ref} className={cn(gridVariants({ gap }), className)} {...props} />
  ),
);
Grid.displayName = 'Grid';

export { Container, Grid, Row, Stack };
