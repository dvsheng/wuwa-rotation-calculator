import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const toggleGroupVariants = cva(
  'inline-flex items-center justify-center rounded-md bg-muted text-muted-foreground',
  {
    variants: {
      variant: {
        default: 'h-10 p-1',
        outline: 'border border-input bg-transparent',
      },
      size: {
        default: 'h-10',
        sm: 'h-9',
        lg: 'h-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const toggleGroupItemVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-sm px-3 text-sm font-medium whitespace-nowrap transition-all hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm',
  {
    variants: {
      variant: {
        default: 'h-8',
        outline:
          'border border-input bg-transparent shadow-xs hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-8 px-2.5',
        sm: 'h-7 px-2',
        lg: 'h-9 px-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function ToggleGroup({
  className,
  variant,
  size,
  children,
  ...properties
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> & {
  variant?: VariantProps<typeof toggleGroupVariants>['variant'];
  size?: VariantProps<typeof toggleGroupVariants>['size'];
}) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      className={cn(toggleGroupVariants({ variant, size }), className)}
      {...properties}
    >
      {children}
    </ToggleGroupPrimitive.Root>
  );
}

function ToggleGroupItem({
  className,
  children,
  variant,
  size,
  ...properties
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> & {
  variant?: VariantProps<typeof toggleGroupItemVariants>['variant'];
  size?: VariantProps<typeof toggleGroupItemVariants>['size'];
}) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-variant={variant}
      data-size={size}
      className={cn(toggleGroupItemVariants({ variant, size }), className)}
      {...properties}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
}

export { ToggleGroup, ToggleGroupItem };
