import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { Row } from '@/components/ui/layout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const SelectorRow = ({
  className,
  ...properties
}: ComponentPropsWithoutRef<typeof Row>) => (
  <Row className={cn('items-center gap-3', className)} {...properties} />
);

const SelectorIconContainer = ({
  className,
  ...properties
}: ComponentPropsWithoutRef<'div'>) => (
  <div
    className={cn('flex w-20 shrink-0 items-center justify-center', className)}
    {...properties}
  />
);

const SelectorSelectTrigger = ({
  className,
  ...properties
}: ComponentPropsWithoutRef<typeof SelectTrigger>) => (
  <SelectTrigger
    className={cn('bg-background w-20 shrink-0', className)}
    {...properties}
  />
);

interface SelectorLayoutProperties {
  icon: ReactNode;
  iconClassName?: string;
  children: ReactNode;
}

export const SelectorLayout = ({
  icon,
  iconClassName,
  children,
}: SelectorLayoutProperties) => (
  <SelectorRow>
    <SelectorIconContainer className={iconClassName}>{icon}</SelectorIconContainer>
    <Row gap="component" className="flex-1">
      {children}
    </Row>
  </SelectorRow>
);

export const SelectorSkeleton = ({
  withSecondary = true,
}: {
  withSecondary?: boolean;
}) => (
  <SelectorLayout icon={<Skeleton className="size-10" />}>
    <Skeleton className="h-9 flex-1" />
    {withSecondary && <Skeleton className="h-9 w-20 shrink-0" />}
  </SelectorLayout>
);

interface SecondarySelectorProperties {
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}

export const SecondarySelector = ({
  value,
  onValueChange,
  options,
}: SecondarySelectorProperties) => (
  <Select value={value} onValueChange={onValueChange}>
    <SelectorSelectTrigger>
      <SelectValue />
    </SelectorSelectTrigger>
    <SelectContent>
      {options.map((opt) => (
        <SelectItem key={opt.value} value={opt.value}>
          {opt.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);
