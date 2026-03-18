import { ListTreeIcon, PanelLeftCloseIcon, PanelLeftOpenIcon } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';

import { Button } from '../ui/button';
import { Collapsible, CollapsibleContent } from '../ui/collapsible';
import { Row, Stack } from '../ui/layout';
import { ScrollArea } from '../ui/scroll-area';
import { Text } from '../ui/typography';

export type TableOfContentsItem = {
  id: string;
  label: string;
  caption?: string;
  accordionValue?: string;
};

export type TableOfContentsSidebarVariant = 'default' | 'compact';

const scrollToSection = (sectionId: string) => {
  if (typeof document === 'undefined') {
    return;
  }

  document.querySelector<HTMLElement>(`#${sectionId}`)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
};

export const TableOfContentsSidebar = ({
  items,
  onItemSelect,
  variant = 'default',
}: {
  items: Array<TableOfContentsItem>;
  onItemSelect?: (item: TableOfContentsItem) => void;
  variant?: TableOfContentsSidebarVariant;
}) => {
  const isCompact = variant === 'compact';
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn(
        'border-border top-panel shrink-0 self-start overflow-hidden border-r transition-all duration-200 lg:sticky',
        isOpen ? 'w-full lg:w-64' : 'w-full lg:w-12',
      )}
    >
      <div
        className={cn(
          'bg-muted/20 flex items-center border-b px-2 py-2',
          isOpen ? 'justify-between' : 'justify-center',
        )}
      >
        {isOpen && (
          <Row gap="trim" align="center">
            <ListTreeIcon className="text-muted-foreground size-4" />
            <Text variant="label" tone="muted">
              Table of Contents
            </Text>
          </Row>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={
            isOpen ? 'Collapse table of contents' : 'Expand table of contents'
          }
          onClick={() => setIsOpen((current) => !current)}
        >
          {isOpen ? <PanelLeftCloseIcon /> : <PanelLeftOpenIcon />}
        </Button>
      </div>

      {isOpen ? (
        <CollapsibleContent forceMount className="data-[state=closed]:hidden">
          <ScrollArea style={{ height: 'calc(100vh - 10rem)' }}>
            <Stack gap="none" className="py-1">
              {items.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  variant="ghost"
                  className={
                    isCompact
                      ? 'h-auto justify-start rounded-none px-3 py-1 text-left'
                      : 'h-auto justify-start rounded-none px-3 py-1.5 text-left'
                  }
                  onClick={() => {
                    onItemSelect?.(item);
                    requestAnimationFrame(() => scrollToSection(item.id));
                  }}
                >
                  <Stack gap="none" align="start" className="min-w-0">
                    <Text
                      variant={isCompact ? 'caption' : 'bodySm'}
                      className="w-full truncate"
                    >
                      {item.label}
                    </Text>
                    {item.caption && (
                      <Text variant="caption" tone="muted" className="truncate">
                        {item.caption}
                      </Text>
                    )}
                  </Stack>
                </Button>
              ))}
            </Stack>
          </ScrollArea>
        </CollapsibleContent>
      ) : (
        <div className="flex flex-col items-center gap-2 py-3">
          <ListTreeIcon className="text-muted-foreground size-4" />
        </div>
      )}
    </Collapsible>
  );
};
