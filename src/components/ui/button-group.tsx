import * as React from 'react';

import { cn } from '@/lib/utils';

interface ButtonGroupProperties extends React.ComponentProps<'div'> {}

export function ButtonGroup({ className, ...properties }: ButtonGroupProperties) {
  return (
    <div
      data-slot="button-group"
      className={cn('inline-flex items-center gap-2', className)}
      {...properties}
    />
  );
}
