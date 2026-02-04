import { ChevronDown, ChevronUp } from 'lucide-react';
import { Fragment, useState } from 'react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

export interface PaletteSubgroup<T> {
  name: string;
  items: Array<T>;
}

export interface PaletteGroup<T> {
  name: string;
  subgroups: Array<PaletteSubgroup<T>>;
}

export interface PaletteProperties<T> {
  groups: Array<PaletteGroup<T>>;
  renderItem: (item: T) => ReactNode;
  getItemKey: (item: T) => string;
  emptyMessage?: string;
  className?: string;
  isCollapsible?: boolean;
  headerText?: string;
  defaultOpen?: boolean;
}

export function Palette<T>({
  groups,
  renderItem,
  getItemKey,
  emptyMessage = 'No items available',
  className,
  isCollapsible = false,
  headerText,
  defaultOpen = true,
}: PaletteProperties<T>) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const hasItems = groups.some((g) => g.subgroups.some((sg) => sg.items.length > 0));

  const content = hasItems ? (
    <ScrollArea className="w-full">
      <div className="flex flex-col">
        {groups.map((group, groupIndex) => {
          const allItems = group.subgroups.flatMap((sg) => sg.items);
          if (allItems.length === 0) return;

          return (
            <div
              key={group.name}
              className={cn(
                'flex items-start gap-3 px-3 py-2',
                groupIndex > 0 && 'border-border border-t',
              )}
            >
              <Text className="text-primary w-24 shrink-0 pt-0.5 text-[10px] font-bold tracking-wider uppercase">
                {group.name}
              </Text>
              <div className="border-border h-auto self-stretch border-l" />
              <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                {allItems.map((item) => (
                  <Fragment key={getItemKey(item)}>{renderItem(item)}</Fragment>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  ) : (
    <div className="text-muted-foreground flex items-center justify-center py-4 text-sm font-medium italic">
      {emptyMessage}
    </div>
  );

  if (isCollapsible) {
    return (
      <div className={cn('bg-background border-border border', className)}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="flex w-full items-center justify-between px-4 py-2 hover:bg-transparent"
            >
              <Text className="text-sm font-semibold">{headerText}</Text>
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t">{content}</CollapsibleContent>
        </Collapsible>
      </div>
    );
  }

  return (
    <div className={cn('bg-background border-border border', className)}>
      {headerText && (
        <div className="border-border border-b px-4 py-2">
          <Text className="text-sm font-semibold">{headerText}</Text>
        </div>
      )}
      {content}
    </div>
  );
}
