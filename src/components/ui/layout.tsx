import * as React from 'react';

import { cn } from '@/lib/utils';

const Section = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <section ref={ref} className={cn('space-y-8', className)} {...props} />
  ),
);
Section.displayName = 'Section';

const Container = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('w-full p-6', className)} {...props} />
));
Container.displayName = 'Container';

const Grid = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    cols?: number | { sm?: number; md?: number; lg?: number; xl?: number };
  }
>(({ className, cols, ...props }, ref) => {
  // Simple handling for cols prop if needed, or rely on className
  return <div ref={ref} className={cn('grid w-full gap-6', className)} {...props} />;
});
Grid.displayName = 'Grid';

const Row = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center', className)} {...props} />
  ),
);
Row.displayName = 'Row';

const CardGrid = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3',
        className,
      )}
      {...props}
    />
  ),
);
CardGrid.displayName = 'CardGrid';

const FormGrid = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('grid grid-cols-2 gap-2', className)} {...props} />
  ),
);
FormGrid.displayName = 'FormGrid';

const Stack = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { spacing?: 'xs' | 'sm' | 'default' | 'lg' }
>(({ className, spacing = 'default', ...props }, ref) => {
  const spacingClass = {
    xs: 'space-y-1',
    sm: 'space-y-2',
    default: 'space-y-4',
    lg: 'space-y-8',
  }[spacing];

  return <div ref={ref} className={cn(spacingClass, className)} {...props} />;
});
Stack.displayName = 'Stack';

const Box = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'border-border bg-card text-card-foreground rounded-md border p-3 shadow-sm',
        className,
      )}
      {...props}
    />
  ),
);
Box.displayName = 'Box';

export { Box, CardGrid, Container, FormGrid, Grid, Row, Section, Stack };
