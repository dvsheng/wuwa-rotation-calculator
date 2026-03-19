import { AlertTriangle } from 'lucide-react';

import { Row, Stack } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';

export function DataLoadFailed() {
  return (
    <Row
      gap="trim"
      align="start"
      className="border-destructive/20 bg-destructive/5 p-panel rounded-md border"
    >
      <AlertTriangle className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
      <Stack gap="none">
        <Text variant="caption" tone="destructive">
          Data failed to load.
        </Text>
      </Stack>
    </Row>
  );
}
