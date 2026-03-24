import { AlertCircle, BarChart2, Download, ListTree } from 'lucide-react';
import { useState } from 'react';

import { DashboardSectionHeader } from '@/components/common/DashboardSectionHeader';
import { Button } from '@/components/ui/button';
import { Container, Row, Stack } from '@/components/ui/layout';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/typography';
import type { useRotationCalculation } from '@/hooks/useRotationCalculation';

import { AttackBreakdownDataTable } from './AttackBreakdownDataTable';
import { CharacterBreakdownDataTable } from './CharacterBreakdownDataTable';
import { downloadRotationResultCsv } from './rotation-result-export.utilities';
import { RotationResultSummary } from './RotationResultSummary';
import { RotationSummaryTab } from './RotationSummaryTab';
import { SensitivityAnalysisTable } from './SensitivityAnalysisTable';

type RotationResultContainerProperties = Pick<
  ReturnType<typeof useRotationCalculation>,
  'data' | 'isPlaceholderData'
>;

export const RotationResultContainer = ({
  data: result,
  isPlaceholderData,
}: RotationResultContainerProperties) => {
  const [selectedTab, setSelectedTab] = useState('summary');
  const [inspectorPortalNode, setInspectorPortalNode] = useState<HTMLDivElement>();
  if (!result) {
    return;
  }

  return (
    <Container className="flex h-full min-h-0 w-full flex-col overflow-y-auto md:flex-row md:overflow-hidden">
      <Stack className="min-h-0 max-w-7xl flex-2 md:overflow-hidden">
        <DashboardSectionHeader
          title="Results"
          subtitle={`${result.attackCount} ${result.attackCount === 1 ? 'attack' : 'attacks'}`}
          description="Review the calculated output for the current build here. Use the tabs to switch between summary, per-attack, per-character, and sensitivity views."
          icon={<BarChart2 />}
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadRotationResultCsv(result.mergedDamageDetails)}
              disabled={result.mergedDamageDetails.length === 0}
            >
              <Download />
              Export as CSV
            </Button>
          }
        />
        <Stack gap="component" className="p-page min-h-0 md:flex-1">
          {isPlaceholderData && (
            <Row className="border-warning/20 bg-warning/10 text-warning rounded-lg border px-4 py-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <Stack>
                <Text variant="label" className="text-warning">
                  Outdated Result
                </Text>
                <Text variant="caption" className="text-warning/80">
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
          <Tabs
            value={selectedTab}
            onValueChange={setSelectedTab}
            className="min-h-0 md:flex-1 md:overflow-hidden"
          >
            <TabsList className="shrink-0">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="data-table">By Attack</TabsTrigger>
              <TabsTrigger value="character-breakdown">By Character</TabsTrigger>
              <TabsTrigger value="sensitivity-analysis">Sensitivity</TabsTrigger>
            </TabsList>
            <TabsContent
              value="summary"
              className="flex min-h-0 w-full md:overflow-hidden"
            >
              <RotationSummaryTab
                result={result}
                inspectorPortalNode={inspectorPortalNode}
              />
            </TabsContent>
            <TabsContent
              value="data-table"
              className="flex min-h-0 w-full md:overflow-hidden"
            >
              <AttackBreakdownDataTable
                mergedDamageDetails={result.mergedDamageDetails}
                inspectorPortalNode={inspectorPortalNode}
              />
            </TabsContent>
            <TabsContent
              value="character-breakdown"
              className="flex min-h-0 w-full md:overflow-hidden"
            >
              <CharacterBreakdownDataTable
                result={result.mergedDamageDetails}
                totalDamage={result.totalDamage}
                inspectorPortalNode={inspectorPortalNode}
              />
            </TabsContent>
            <TabsContent
              value="sensitivity-analysis"
              className="flex min-h-0 w-full md:overflow-hidden"
            >
              <SensitivityAnalysisTable
                sensitivityAnalysis={result.sensitivityAnalysis}
                inspectorPortalNode={inspectorPortalNode}
              />
            </TabsContent>
          </Tabs>
        </Stack>
      </Stack>
      <Separator className="md:hidden" />
      <Separator orientation="vertical" className="hidden self-stretch md:block" />
      <Stack className="min-h-0 flex-1">
        <DashboardSectionHeader
          title="Details"
          description="Use this inspector to drill into the row selected in Results. It updates with the detailed stat math, hit data, or scenario deltas behind that selection."
          icon={<ListTree />}
        />
        <ScrollArea className="min-h-0 md:flex-1" orientation="both">
          <div
            className="p-page"
            ref={(node) => setInspectorPortalNode(node ?? undefined)}
          />
        </ScrollArea>
      </Stack>
    </Container>
  );
};
