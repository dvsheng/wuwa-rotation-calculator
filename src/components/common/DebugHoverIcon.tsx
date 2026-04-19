import { CircleHelp } from 'lucide-react';

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

export const DebugHoverIcon = ({ value }: { value: unknown }) => (
  <HoverCard openDelay={150} closeDelay={100}>
    <HoverCardTrigger asChild>
      <button type="button" className="text-muted-foreground hover:text-foreground cursor-help transition-colors">
        <CircleHelp className="h-3.5 w-3.5" />
      </button>
    </HoverCardTrigger>
    <HoverCardContent className="w-fit max-w-3xl overflow-hidden p-0">
      <div className="max-h-96 max-w-3xl overflow-auto">
        <pre className="w-fit min-w-full p-4 text-xs">
          {JSON.stringify(value, undefined, 4)}
        </pre>
      </div>
    </HoverCardContent>
  </HoverCard>
);
