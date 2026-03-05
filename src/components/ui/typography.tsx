import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithoutRef, ElementType } from 'react';

import { cn } from '@/lib/utils';

const textVariants = cva('', {
  variants: {
    variant: {
      /**
       * Hero numbers and primary stats. Use for big totals, damage figures.
       * Renders as `<p>` by default — pass `as="h1"` etc. for semantics.
       */
      display: 'text-4xl font-bold tracking-tight',

      /**
       * Section and page headings.
       */
      heading: 'text-2xl font-semibold tracking-tight',

      /**
       * Default readable body copy.
       */
      body: 'text-base',

      /**
       * Secondary / supporting text. Muted colour at smaller size.
       */
      small: 'text-sm text-muted-foreground',

      /**
       * Fine-print details — indexes, timestamps, metadata.
       */
      caption: 'text-xs text-muted-foreground',

      /**
       * All-caps category labels, section labels, field overlines.
       */
      overline: 'text-xs font-semibold tracking-wider uppercase text-muted-foreground',
    },
  },
  defaultVariants: {
    variant: 'body',
  },
});

type TextProps<T extends ElementType = 'p'> = VariantProps<typeof textVariants> & {
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, 'as'>;

export function Text<T extends ElementType = 'p'>({
  as,
  variant,
  className,
  ...props
}: TextProps<T>) {
  const Comp = (as ?? 'p') as ElementType;
  return <Comp className={cn(textVariants({ variant }), className)} {...props} />;
}
