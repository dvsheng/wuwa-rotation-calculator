import * as React from 'react';

import { cn } from '@/lib/utils';

const Section = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...properties }, reference) => (
    <section ref={reference} className={cn('space-y-8', className)} {...properties} />
  ),
);
Section.displayName = 'Section';

const Container = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...properties }, reference) => (
  <div ref={reference} className={cn('w-full p-page', className)} {...properties} />
));
Container.displayName = 'Container';

const Grid = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    cols?: number | { sm?: number; md?: number; lg?: number; xl?: number };
  }
>(({ className, cols, ...properties }, reference) => {
  // Simple handling for cols prop if needed, or rely on className
  return (
    <div
      ref={reference}
      className={cn('grid w-full gap-6', className)}
      {...properties}
    />
  );
});
Grid.displayName = 'Grid';

const Row = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...properties }, reference) => (
    <div ref={reference} className={cn('flex', className)} {...properties} />
  ),
);
Row.displayName = 'Row';

const CardGrid = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...properties }, reference) => (
    <div
      ref={reference}
      className={cn(
        'grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3',
        className,
      )}
      {...properties}
    />
  ),
);
CardGrid.displayName = 'CardGrid';

const FormGrid = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...properties }, reference) => (
    <div
      ref={reference}
      className={cn('grid grid-cols-2 gap-2', className)}
      {...properties}
    />
  ),
);
FormGrid.displayName = 'FormGrid';

const Stack = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...properties }, reference) => (
    <div ref={reference} className={cn('flex flex-col', className)} {...properties} />
  ),
);
Stack.displayName = 'Stack';

const Box = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...properties }, reference) => (
    <div
      ref={reference}
      className={cn(
        'border-border bg-card text-card-foreground rounded-md border p-component shadow-sm',
        className,
      )}
      {...properties}
    />
  ),
);
Box.displayName = 'Box';

export { Box, CardGrid, Container, FormGrid, Grid, Row, Section, Stack };
