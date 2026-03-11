import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithoutRef, ElementType } from 'react';

import { cn } from '@/lib/utils';

const textVariants = cva('', {
  variants: {
    variant: {
      display: 'text-4xl font-bold tracking-tight',
      heading: 'text-xl font-semibold tracking-tight',
      title: 'text-base font-semibold tracking-tight',
      body: 'text-base',
      bodySm: 'text-sm',
      caption: 'text-xs',
      overline: 'text-xs font-semibold tracking-wider uppercase',
      label: 'text-sm font-medium',
      stat: 'text-2xl font-semibold tracking-tight',
    },
    tone: {
      default: 'text-foreground',
      muted: 'text-muted-foreground',
      destructive: 'text-destructive',
    },
    tabular: {
      true: 'tabular-nums',
    },
  },
  defaultVariants: {
    variant: 'body',
    tone: 'default',
  },
});

type TextProps<T extends ElementType = 'p'> = VariantProps<typeof textVariants> & {
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, 'as'>;

export function Text<T extends ElementType = 'p'>({
  as,
  variant,
  tone,
  tabular,
  className,
  ...props
}: TextProps<T>) {
  const Comp = (as ?? 'p') as ElementType;
  return (
    <Comp
      className={cn(textVariants({ variant, tone, tabular }), className)}
      {...props}
    />
  );
}
