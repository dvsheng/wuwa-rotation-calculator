import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

// Shared variant maps — all layout primitives draw from the same pool

const gapVariants = {
  none: '',
  trim: 'gap-trim',
  inset: 'gap-inset',
  component: 'gap-component',
  panel: 'gap-panel',
  page: 'gap-page',
} as const;

const alignVariants = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
} as const;

const justifyVariants = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
} as const;

// Stack — flex column container

const stackVariants = cva('flex flex-col', {
  variants: {
    gap: gapVariants,
    align: alignVariants,
    justify: justifyVariants,
    fullWidth: { true: 'w-full' },
    fullHeight: { true: 'h-full' },
  },
  defaultVariants: { gap: 'none' },
});

type StackProps = React.ComponentProps<'div'> & VariantProps<typeof stackVariants>;

function Stack({
  className,
  gap,
  align,
  justify,
  fullWidth,
  fullHeight,
  ...props
}: StackProps) {
  return (
    <div
      className={cn(
        stackVariants({ gap, align, justify, fullWidth, fullHeight }),
        className,
      )}
      {...props}
    />
  );
}
Stack.displayName = 'Stack';

// Row — flex row container

const rowVariants = cva('flex flex-row', {
  variants: {
    gap: gapVariants,
    align: {
      ...alignVariants,
      baseline: 'items-baseline',
    },
    justify: justifyVariants,
    fullWidth: { true: 'w-full' },
    fullHeight: { true: 'h-full' },
    wrap: { true: 'flex-wrap' },
  },
  defaultVariants: { gap: 'none', align: 'center' },
});

type RowProps = React.ComponentProps<'div'> & VariantProps<typeof rowVariants>;

function Row({
  className,
  gap,
  align,
  justify,
  fullWidth,
  fullHeight,
  wrap,
  ...props
}: RowProps) {
  return (
    <div
      className={cn(
        rowVariants({ gap, align, justify, fullWidth, fullHeight, wrap }),
        className,
      )}
      {...props}
    />
  );
}
Row.displayName = 'Row';

// Box — centered flex container

const boxVariants = cva('flex items-center justify-center', {
  variants: {
    gap: gapVariants,
    direction: {
      row: 'flex-row',
      col: 'flex-col',
    },
    fullWidth: { true: 'w-full' },
    fullHeight: { true: 'h-full' },
  },
  defaultVariants: { gap: 'none' },
});

type BoxProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof boxVariants>;

function Box({ className, gap, direction, fullWidth, fullHeight, ...props }: BoxProps) {
  return (
    <div
      className={cn(boxVariants({ gap, direction, fullWidth, fullHeight }), className)}
      {...props}
    />
  );
}
Box.displayName = 'Box';

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

type ContainerProps = React.ComponentProps<'div'> &
  VariantProps<typeof containerVariants>;

function Container({ className, padding, ...props }: ContainerProps) {
  return <div className={cn(containerVariants({ padding }), className)} {...props} />;
}
Container.displayName = 'Container';

// Grid — generic grid container

const gridVariants = cva('grid w-full', {
  variants: { gap: gapVariants },
  defaultVariants: { gap: 'panel' },
});

type GridProps = React.ComponentProps<'div'> & VariantProps<typeof gridVariants>;

function Grid({ className, gap, ...props }: GridProps) {
  return <div className={cn(gridVariants({ gap }), className)} {...props} />;
}
Grid.displayName = 'Grid';

export { Box, Container, Grid, Row, Stack };
