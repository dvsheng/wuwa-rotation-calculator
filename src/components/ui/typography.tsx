import * as React from 'react';

import { cn } from '@/lib/utils';

const Heading = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement> & { level?: 1 | 2 | 3 | 4 }
>(({ className, level = 1, ...properties }, reference) => {
  const Comp = `h${level}` as any;
  const sizeClasses = {
    1: 'text-2xl font-bold tracking-tight',
    2: 'text-xl font-semibold tracking-tight',
    3: 'text-lg font-semibold',
    4: 'text-base font-semibold',
  };

  return (
    <Comp
      ref={reference}
      className={cn(sizeClasses[level], className)}
      {...properties}
    />
  );
});
Heading.displayName = 'Heading';

const Text = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & {
    variant?: 'default' | 'muted' | 'small' | 'tiny';
  }
>(({ className, variant = 'default', ...properties }, reference) => {
  const variantClasses = {
    default: 'text-base',
    muted: 'text-sm text-muted-foreground',
    small: 'text-xs',
    tiny: 'text-[10px]',
  };

  return (
    <p
      ref={reference}
      className={cn(variantClasses[variant], className)}
      {...properties}
    />
  );
});
Text.displayName = 'Text';

const LabelText = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...properties }, reference) => (
  <span
    ref={reference}
    className={cn(
      'text-muted-foreground text-[10px] font-semibold uppercase',
      className,
    )}
    {...properties}
  />
));
LabelText.displayName = 'LabelText';

export { Heading, LabelText, Text };
