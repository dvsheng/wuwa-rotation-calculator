import { Fragment } from 'react';
import type { ReactNode } from 'react';

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
}

export function Palette<T>({
  groups,
  renderItem,
  getItemKey,
  emptyMessage = 'No items available',
  className,
}: PaletteProps<T>) {
  const hasItems = groups.some((g) => g.subgroups.some((sg) => sg.items.length > 0));

  if (!hasItems) {
    return (
      <div className="text-muted-foreground flex items-center justify-center py-4 text-sm font-medium italic">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ScrollArea className={cn('w-full', className)}>
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
}
