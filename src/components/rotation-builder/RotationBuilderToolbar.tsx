import { BarChart2, Sword, User } from 'lucide-react';
import { Suspense } from 'react';

import { SaveRotationButton } from '@/components/builds/SaveRotationButton';
import { CalculateRotationButton } from '@/components/rotation-builder/results/CalculateRotationButton';
import { ButtonGroup } from '@/components/ui/button-group';
import { Skeleton } from '@/components/ui/skeleton';
import { useRotationCalculation } from '@/hooks/useRotationCalculation';

import { Badge } from '../ui/badge';
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
              <Badge className="bg-amber-500/15 text-amber-500">
                Outdated — Recalculate
              </Badge>
            )}
          </Row>
        )}
      </Row>

      <Row align="center" gap="panel">
        <ButtonGroup>
          <Suspense fallback={<Skeleton className="h-8 w-36" />}>
            <SaveRotationButton />
          </Suspense>
          <CalculateRotationButton onCalculated={() => setSelectedTab('results')} />
        </ButtonGroup>
      </Row>
    </Row>
  );
}
