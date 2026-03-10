import { AlertCircle, BarChart2, ListTree } from 'lucide-react';
import { useState } from 'react';

import { DashboardSectionHeader } from '@/components/common/DashboardSectionHeader';
import { Container, Row, Stack } from '@/components/ui/layout';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/typography';
import { useRotationCalculation } from '@/hooks/useRotationCalculation';

import { AttackBreakdownDataTable } from './AttackBreakdownDataTable';
import { CharacterBreakdownDataTable } from './CharacterBreakdownDataTable';
import { RotationResultSummary } from './RotationResultSummary';

export const RotationResultContainer = () => {
  const [inspectorPortalNode, setInspectorPortalNode] = useState<
    HTMLDivElement | undefined
  >();
  const { data: result, isStale } = useRotationCalculation();
  if (!result) {
    return;
  }

  return (
    <Container className="h-full min-h-0">
      <Row align="stretch" className="h-full min-h-0">
        <Stack className="min-h-0 flex-1 overflow-hidden">
          <DashboardSectionHeader
            title="Results"
            subtitle={`${result.attackCount} ${result.attackCount === 1 ? 'attack' : 'attacks'}`}
            description="Calculated damage output for your current rotation."
            icon={<BarChart2 />}
          />
          <Stack gap="component" className="p-page min-h-0 flex-1">
            {isStale && (
              <Row className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-amber-500">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <Stack>
                  <Text variant="small" className="font-medium text-amber-500">
                    Outdated Result
                  </Text>
                  <Text variant="caption" className="text-amber-500/80">
                    The rotation has changed. Recalculate to see updated damage.
                  </Text>
                </Stack>
              </Row>
            )}

            <RotationResultSummary
              totalDamage={result.totalDamage}
              attackCount={result.attackCount}
              damageInstanceCount={result.damageDetails.length}
            />
            <Tabs defaultValue="data-table" className="min-h-0 flex-1 overflow-hidden">
              <TabsList className="shrink-0">
                <TabsTrigger value="data-table">By Attack</TabsTrigger>
                <TabsTrigger value="character-breakdown">By Character</TabsTrigger>
              </TabsList>
              <TabsContent
                value="data-table"
                className="flex min-h-0 w-full overflow-hidden"
              >
                <AttackBreakdownDataTable
                  mergedDamageDetails={result.mergedDamageDetails}
                  inspectorPortalNode={inspectorPortalNode}
                />
              </TabsContent>
              <TabsContent
                value="character-breakdown"
                className="flex min-h-0 w-full overflow-hidden"
              >
                <CharacterBreakdownDataTable
                  mergedDamageDetails={result.mergedDamageDetails}
                  totalDamage={result.totalDamage}
                  inspectorPortalNode={inspectorPortalNode}
                />
              </TabsContent>
            </Tabs>
          </Stack>
        </Stack>

        <Separator orientation="vertical" className="self-stretch" />
        <Stack className="min-h-0 w-2xl overflow-hidden">
          <DashboardSectionHeader
            title="Details"
            description="Select a row in Results to inspect detailed stat contributions."
            icon={<ListTree />}
          />
          <Stack
            ref={(node) => setInspectorPortalNode(node ?? undefined)}
            className="p-page min-h-0 flex-1 overflow-y-auto"
          />
        </Stack>
      </Row>
    </Container>
  );
};
