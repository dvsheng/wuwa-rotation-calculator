import { BarChart2, Sword, User } from 'lucide-react';
import { Suspense } from 'react';

import { SaveRotationButton } from '@/components/builds/SaveRotationButton';
import { CalculateRotationButton } from '@/components/rotation-builder/results/CalculateRotationButton';
import { ButtonGroup } from '@/components/ui/button-group';
import { Skeleton } from '@/components/ui/skeleton';
import { useRotationCalculation } from '@/hooks/useRotationCalculation';

import { Badge } from '../ui/badge';
import { Box, Row } from '../ui/layout';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Text } from '../ui/typography';

type RotationBuilderTab = 'team' | 'rotation' | 'results';

export function RotationBuilderToolbar({
  selectedTab,
  setSelectedTab,
}: {
  selectedTab: RotationBuilderTab;
  setSelectedTab: (tab: RotationBuilderTab) => void;
}) {
  const { data: result, isPlaceholderData } = useRotationCalculation();

  return (
    <Row align="center" justify="between" className="px-panel h-12 border-b">
      <Row gap="inset">
        <Tabs
          value={selectedTab}
          onValueChange={(value) => {
            setSelectedTab(value as RotationBuilderTab);
          }}
        >
          <TabsList>
            <TabsTrigger value="team">
              <User /> Team
            </TabsTrigger>
            <TabsTrigger value="rotation">
              <Sword /> Rotation
            </TabsTrigger>
            {result && (
              <TabsTrigger value="results">
                <BarChart2 />
                Results
                <span className="bg-accent size-1.5 rounded-full" />
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
        {result && (
          <Box gap="inset">
            <Text>Total Damage:</Text>
            <Text
              className={
                isPlaceholderData
                  ? 'text-muted-foreground line-through'
                  : 'text-primary'
              }
            >
              {Math.round(result.totalDamage).toLocaleString()}
            </Text>
            {isPlaceholderData && (
              <Badge className="bg-warning text-warning-foreground">
                Outdated — Recalculate
              </Badge>
            )}
          </Box>
        )}
      </Row>
      <ButtonGroup>
        <Suspense fallback={<Skeleton className="h-8 w-36" />}>
          <SaveRotationButton />
        </Suspense>
        <CalculateRotationButton onCalculated={() => setSelectedTab('results')} />
      </ButtonGroup>
    </Row>
  );
}
