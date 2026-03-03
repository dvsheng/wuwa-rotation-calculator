import * as React from 'react';

import { cn } from '@/lib/utils';

export interface SidebarProperties extends React.ComponentProps<'aside'> {
  open?: boolean;
}

function Sidebar({ open = true, className, ...properties }: SidebarProperties) {
  return (
    <aside
      data-slot="sidebar"
      data-state={open ? 'open' : 'closed'}
      className={cn(
        'border-border bg-card flex shrink-0 flex-col overflow-hidden border-r transition-[width] duration-300 ease-in-out',
        open ? 'w-92' : 'w-10',
        className,
      )}
      {...properties}
    />
  );
}

function SidebarHeader({ className, ...properties }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-header"
      className={cn('border-border shrink-0 border-b', className)}
      {...properties}
    />
  );
}

function SidebarContent({ className, ...properties }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn('min-h-0 flex-1 overflow-hidden', className)}
      {...properties}
    />
  );
}

export { Sidebar, SidebarContent, SidebarHeader };
