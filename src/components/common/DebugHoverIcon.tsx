import { CircleHelp } from 'lucide-react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export const DebugHoverIcon = ({ value }: { value: unknown }) => (
  <Popover>
    <PopoverTrigger asChild>
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
      >
        <CircleHelp className="h-3.5 w-3.5" />
      </button>
    </PopoverTrigger>
    <PopoverContent className="w-fit max-w-3xl overflow-hidden p-0">
      <div className="max-h-96 max-w-3xl overflow-auto">
        <pre className="w-fit min-w-full p-4 text-xs">
          {JSON.stringify(value, undefined, 4)}
        </pre>
      </div>
    </PopoverContent>
  </Popover>
);
