import type { GridLayoutProps } from 'react-grid-layout';
import ReactGridLayout from 'react-grid-layout';

import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Text } from '@/components/ui/typography';
import type { Attack } from '@/schemas/rotation';

interface RotationTimelineProps {
  items: Array<Attack>;
  width: number;
  gridConfig: GridLayoutProps['gridConfig'];
}

export const RotationTimeline = ({
  items,
  width,
  gridConfig,
}: RotationTimelineProps) => {
  const layoutProps: Omit<GridLayoutProps, 'children'> = {
    width,
    gridConfig: {
      ...gridConfig,
      rowHeight: 70,
    },
    dragConfig: { enabled: false },
    resizeConfig: { enabled: false },
    layout: items.map((item, index) => ({
      i: item.id,
      x: index,
      y: 0,
      w: 1,
      h: 1,
    })),
  };
  return (
    <div className="bg-muted/20 border-border/50 rounded-lg border">
      <ReactGridLayout {...layoutProps}>
        {items.map((item, index) => (
          <div key={item.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="bg-card hover:bg-accent/50 border-primary/10 group flex h-full flex-col justify-start overflow-hidden px-2 py-1 shadow-sm transition-colors">
                  <div className="flex items-center justify-between gap-1 overflow-hidden">
                    <Text className="text-primary/80 truncate text-[9px] leading-[1] font-bold tracking-wider uppercase">
                      {item.characterName}
                    </Text>
                    {/* We use index + 1 or calculate x from the layout provided by parent */}
                    <span className="text-muted-foreground/60 group-hover:text-primary/60 shrink-0 font-mono text-[8px] font-bold transition-colors">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="-mt-0.5 min-w-0 overflow-hidden">
                    <Text className="text-foreground truncate text-[10px] leading-[1.1] font-medium">
                      {item.parentName}
                    </Text>
                    <Text className="text-muted-foreground truncate text-[9px] leading-[1.1]">
                      {item.name}
                    </Text>
                  </div>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <Text variant="small" className="font-bold">
                  {item.characterName}
                </Text>
                <Text variant="tiny">
                  {item.parentName}: {item.name}
                </Text>
              </TooltipContent>
            </Tooltip>
          </div>
        ))}
      </ReactGridLayout>
    </div>
  );
};
