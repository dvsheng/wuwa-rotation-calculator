import { BarChart2, Sword, User } from 'lucide-react';

import { SaveRotationButton } from '@/components/builds/SaveRotationButton';
import { CalculateRotationButton } from '@/components/rotation-builder/results/CalculateRotationButton';
import { ButtonGroup } from '@/components/ui/button-group';
import { useRotationCalculation } from '@/hooks/useRotationCalculation';
import { cn } from '@/lib/utils';
import type { RotationBuilderTab } from '@/store/rotationBuilderUiSlice';

import { Badge } from '../ui/badge';
import { Box, Row } from '../ui/layout';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Text } from '../ui/typography';

export function RotationBuilderToolbar({
  selectedTab,
  setSelectedTab,
}: {
  selectedTab: RotationBuilderTab;
  setSelectedTab: (tab: RotationBuilderTab) => void;
}) {
  const { data: result, isPlaceholderData } = useRotationCalculation();

  return (
    <Row
      align="center"
      justify="between"
      className="px-panel h-14 overflow-hidden border-b"
    >
      <Row gap="inset">
        <Tabs
          value={selectedTab}
          onValueChange={(value) => {
            setSelectedTab(value as RotationBuilderTab);
          }}
        >
          <TabsList>
            <TabsTrigger value="team">
              <User /> <span className="hidden md:inline">Team</span>
            </TabsTrigger>
            <TabsTrigger value="rotation">
              <Sword /> <span className="hidden md:inline">Rotation</span>
            </TabsTrigger>
            {result && (
              <TabsTrigger value="results">
                <BarChart2 />
                <span className="hidden md:inline">Results</span>
                <span className="bg-accent size-1.5 rounded-full" />
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
        {result && (
          <Box gap="inset" direction="row" className="hidden font-semibold md:flex">
            <Text>Total Damage:</Text>
            <Text
              className={cn(
                'text-mono',
                isPlaceholderData
                  ? 'text-muted-foreground line-through'
                  : 'text-primary',
              )}
            >
              {Math.round(result.totalDamage).toLocaleString()}
            </Text>
            {isPlaceholderData && (
              <Badge className="bg-warning text-warning-foreground">Stale</Badge>
            )}
          </Box>
        )}
      </Row>
      <ButtonGroup>
        <SaveRotationButton />
        <CalculateRotationButton onCalculated={() => setSelectedTab('results')} />
      </ButtonGroup>
    </Row>
  );
}
