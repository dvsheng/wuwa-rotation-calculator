import { AlertCircle, BarChart2, Download } from 'lucide-react';
import { useState } from 'react';

import { DashboardSectionHeader } from '@/components/common/DashboardSectionHeader';
import { Button } from '@/components/ui/button';
import { Row, Stack } from '@/components/ui/layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/typography';
import type { useRotationCalculation } from '@/hooks/useRotationCalculation';

import { AttackBreakdownDataTable } from './AttackBreakdownDataTable';
import { CharacterBreakdownDataTable } from './CharacterBreakdownDataTable';
import { downloadRotationResultCsv } from './rotation-result-export.utilities';
import {
  RotationResultInspectorPanel,
  RotationResultInspectorProvider,
} from './RotationResultInspectorContext';
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
  if (!result) {
    return;
  }

  return (
    <RotationResultInspectorProvider>
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
      <div className="relative h-full min-h-0 w-full">
        <Stack
          fullHeight
          fullWidth
          gap="component"
          className="p-page relative mx-auto min-h-0 max-w-6xl md:flex-1"
        >
          {isPlaceholderData && (
            <Row
              gap="inset"
              className="border-warning/20 bg-warning/10 p-component rounded-lg border"
            >
              <AlertCircle className="text-warning" />
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
            className="h-full min-h-0 md:flex-1 md:overflow-hidden"
          >
            <TabsList>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="data-table">By Attack</TabsTrigger>
              <TabsTrigger value="character-breakdown">By Character</TabsTrigger>
              <TabsTrigger value="sensitivity-analysis">Sensitivity</TabsTrigger>
            </TabsList>
            <TabsContent value="summary" className="flex min-h-0 w-full">
              <RotationSummaryTab result={result} />
            </TabsContent>
            <TabsContent value="data-table" className="flex min-h-0 w-full">
              <AttackBreakdownDataTable
                mergedDamageDetails={result.mergedDamageDetails}
              />
            </TabsContent>
            <TabsContent value="character-breakdown" className="flex min-h-0 w-full">
              <CharacterBreakdownDataTable result={result.mergedDamageDetails} />
            </TabsContent>
            <TabsContent value="sensitivity-analysis" className="flex min-h-0 w-full">
              <SensitivityAnalysisTable
                sensitivityAnalysis={result.sensitivityAnalysis}
              />
            </TabsContent>
          </Tabs>
        </Stack>
        <RotationResultInspectorPanel />
      </div>
    </RotationResultInspectorProvider>
  );
};
