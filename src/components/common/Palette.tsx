import { ChevronDown, ChevronUp } from 'lucide-react';
import { Fragment, useState } from 'react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
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

export interface PaletteProps<T> {
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
}: PaletteProps<T>) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const hasItems = groups.some((g) => g.subgroups.some((sg) => sg.items.length > 0));

  const content = !hasItems ? (
    <div className="text-muted-foreground flex items-center justify-center py-4 text-sm font-medium italic">
      {emptyMessage}
    </div>
  ) : (
    <ScrollArea className="w-full">
      <div className="flex gap-0">
        {groups.map((group, groupIndex) => {
          const hasSubgroupItems = group.subgroups.some((sg) => sg.items.length > 0);
          if (!hasSubgroupItems) return null;

          return (
            <Fragment key={group.name}>
              <div
                className={cn(
                  'flex min-w-[200px] flex-1 flex-col',
                  groupIndex > 0 && 'border-border border-l',
                )}
              >
                <div className="border-b px-3 py-2">
                  <Text className="text-primary text-xs font-bold tracking-wider uppercase">
                    {group.name}
                  </Text>
                </div>
                <div className="flex flex-col gap-2 p-3">
                  {group.subgroups.map((subgroup) => {
                    if (subgroup.items.length === 0) return null;

                    return (
                      <div key={subgroup.name} className="flex flex-col gap-1">
                        <Text
                          variant="small"
                          className="text-muted-foreground text-[10px] font-semibold uppercase"
                        >
                          {subgroup.name}
                        </Text>
                        <div className="flex flex-wrap gap-1">
                          {subgroup.items.map((item) => (
                            <Fragment key={getItemKey(item)}>
                              {renderItem(item)}
                            </Fragment>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
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
