import { BarChart2, Sword, User } from 'lucide-react';
import { Suspense } from 'react';

import { SaveRotationButton } from '@/components/builds/SaveRotationButton';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CalculateRotationButton } from '@/components/rotation-builder/results/CalculateRotationButton';
import { ButtonGroup } from '@/components/ui/button-group';
import { Skeleton } from '@/components/ui/skeleton';
import { useRotationCalculation } from '@/hooks/useRotationCalculation';

import { Row } from '../ui/layout';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Text } from '../ui/typography';

export function RotationBuilderToolbar({
  selectedTab,
  setSelectedTab,
}: {
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
}) {
  const { data: result, isPlaceholderData } = useRotationCalculation();

  return (
    <Row
      align="center"
      justify="between"
      className="border-border bg-background px-panel h-12 shrink-0 border-b"
    >
      <Row gap="compact">
        <Tabs
          value={selectedTab}
          onValueChange={(value) => {
            setSelectedTab(value);
          }}
        >
          <TabsList>
            <TabsTrigger value="team">
              <User size={14} /> Team
            </TabsTrigger>
            <TabsTrigger value="rotation">
              <Sword size={14} /> Rotation
            </TabsTrigger>
            {result && (
              <TabsTrigger value="results">
                <BarChart2 size={14} /> Results
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
        {result && (
          <Row justify="center" align="center" gap="compact">
            <Text>Total Damage:</Text>
            <Text className={isPlaceholderData ? 'text-amber-500' : 'text-primary'}>
              {Math.round(result.totalDamage).toLocaleString()}
            </Text>
          </Row>
        )}
      </Row>

      <Row align="center" gap="panel">
        <ButtonGroup>
          <ErrorBoundary fallback={undefined}>
            <Suspense fallback={<Skeleton className="h-8 w-36" />}>
              <SaveRotationButton />
            </Suspense>
          </ErrorBoundary>
          <CalculateRotationButton onCalculated={() => setSelectedTab('results')} />
        </ButtonGroup>
      </Row>
    </Row>
  );
}
