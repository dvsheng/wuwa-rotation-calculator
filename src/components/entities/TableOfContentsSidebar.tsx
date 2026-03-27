import { Link } from '@tanstack/react-router';
import { ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';

import { Button } from '../ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Stack } from '../ui/layout';
import { Text } from '../ui/typography';

export type TableOfContentsItem = {
  id: string;
  label: string;
  caption?: string;
  accordionValue?: string;
};

export const TableOfContentsSidebar = ({
  items,
}: {
  items: Array<TableOfContentsItem>;
}) => {
  const [open, setIsOpen] = useState(true);
  return (
    <Collapsible open={open} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button type="button" variant="ghost">
          <ChevronsUpDown />
          {open && <Text variant="title">Table of Contents</Text>}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Stack gap="trim" align="start">
          {items.map((item) => (
            <Button key={item.id} asChild variant="ghost">
              <Link to="." hash={item.id}>
                <Stack gap="none" align="start" className="min-w-0">
                  <Text variant="bodySm" className="truncate">
                    {item.label}
                  </Text>
                  {item.caption && (
                    <Text variant="caption" tone="muted" className="truncate">
                      {item.caption}
                    </Text>
                  )}
                </Stack>
              </Link>
            </Button>
          ))}
        </Stack>
      </CollapsibleContent>
    </Collapsible>
  );
};
