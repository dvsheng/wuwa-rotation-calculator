import { AlertCircle, BarChart2, ListTree } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';

import { DashboardSectionHeader } from '@/components/common/DashboardSectionHeader';
import { Container, Row, Stack } from '@/components/ui/layout';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/typography';
import { useRotationCalculation } from '@/hooks/useRotationCalculation';

import { AttackBreakdownDataTable } from './AttackBreakdownDataTable';
import { CharacterBreakdownDataTable } from './CharacterBreakdownDataTable';
import { RotationResultSummary } from './RotationResultSummary';
import { RotationSummaryTab } from './RotationSummaryTab';
import { SensitivityAnalysisTable } from './SensitivityAnalysisTable';

export const RotationResultContainer = () => {
  const [selectedTab, setSelectedTab] = useState('summary');
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
            description="Review the calculated output for the current build here. Use the tabs to switch between summary, per-attack, per-character, and sensitivity views."
            icon={<BarChart2 />}
          />
          <Stack gap="component" className="p-page min-h-0 flex-1">
            {isStale && (
              <Row className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-amber-500">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <Stack>
                  <Text variant="label" className="text-amber-500">
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
              mergedDamageDetails={result.mergedDamageDetails}
            />
            <Tabs
              value={selectedTab}
              onValueChange={setSelectedTab}
              className="min-h-0 flex-1 overflow-hidden"
            >
              <TabsList className="shrink-0">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="data-table">By Attack</TabsTrigger>
                <TabsTrigger value="character-breakdown">By Character</TabsTrigger>
                <TabsTrigger value="sensitivity-analysis">Sensitivity</TabsTrigger>
              </TabsList>
              <TabsContent
                value="summary"
                className="flex min-h-0 w-full overflow-hidden"
              >
                <RotationSummaryTab result={result} />
              </TabsContent>
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
              <TabsContent
                value="sensitivity-analysis"
                className="flex min-h-0 w-full overflow-hidden"
              >
                <SensitivityAnalysisTable
                  sensitivityAnalysis={result.sensitivityAnalysis}
                  inspectorPortalNode={inspectorPortalNode}
                />
              </TabsContent>
            </Tabs>
          </Stack>
        </Stack>

        <Separator orientation="vertical" className="self-stretch" />
        <Stack className="w-xl">
          <DashboardSectionHeader
            title="Details"
            description="Use this inspector to drill into the row selected in Results. It updates with the detailed stat math, hit data, or scenario deltas behind that selection."
            icon={<ListTree />}
          />
          <ScrollArea className="min-h-0 flex-1">
            <Stack
              ref={(node) => setInspectorPortalNode(node ?? undefined)}
              className="p-page"
            />
          </ScrollArea>
        </Stack>
      </Row>
      {inspectorPortalNode && selectedTab === 'summary'
        ? createPortal(
            <Stack align="center" className="h-full justify-center">
              <Text variant="heading">Summary Selected</Text>
              <Text variant="bodySm" tone="muted" className="text-center">
                Switch to By Attack, By Character, or Sensitivity to inspect detailed
                result rows here.
              </Text>
            </Stack>,
            inspectorPortalNode,
          )
        : undefined}
    </Container>
  );
};
