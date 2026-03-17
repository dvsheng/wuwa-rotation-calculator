import type { ColumnDef } from '@tanstack/react-table';
import { Fragment, useState } from 'react';
import { createPortal } from 'react-dom';

import { DataTable } from '@/components/ui/data-table';
import { Row, Stack } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import type {
  ClientSensitivityAnalysis,
  ClientSensitivityAnalysisScenario,
} from '@/services/rotation-calculator/client-output-adapter/adapt-rotation-result-to-client-output';

import { RelativeMagnitudeBar } from './RelativeMagnitudeBar';
import { formatPercentDelta, formatSignedDamage } from './result-chart.utilities';
import { sensitivitySections as buildSensitivitySections } from './sensitivity-pipelines';

interface SensitivityAnalysisTableProperties {
  sensitivityAnalysis: ClientSensitivityAnalysis;
  inspectorPortalNode: HTMLDivElement | undefined;
}

const tableClassNames = {
  wrapper: 'bg-card min-w-0 rounded-lg w-full',
  scrollArea: 'overflow-auto',
  headerRow: 'hover:bg-transparent',
  headerCell:
    'bg-muted/90 text-xs font-semibold tracking-wider uppercase backdrop-blur-sm',
  row: 'cursor-pointer transition-colors',
  cell: 'py-inset',
};

const createColumns = (
  maxDeltaMagnitude: number,
): Array<ColumnDef<ClientSensitivityAnalysisScenario>> => [
  {
    id: 'scenario',
    header: 'Scenario',
    meta: {
      headerClassName: 'w-full',
      cellClassName: 'w-full',
    },
    cell: ({ row }) => (
      <Stack className="min-w-0">
        <Text as="p" variant="bodySm" className="truncate">
          {row.original.label}
        </Text>
        <Text as="p" variant="caption" tone="muted" className="line-clamp-2">
          {row.original.description}
        </Text>
      </Stack>
    ),
  },
  {
    id: 'delta',
    header: () => <div className="text-right">Delta</div>,
    meta: {
      headerClassName: 'w-[10rem] min-w-[10rem]',
      cellClassName: 'w-[10rem] min-w-[10rem]',
    },
    cell: ({ row }) => (
      <Text
        as="p"
        variant="bodySm"
        tabular={true}
        className={cn(
          'text-right font-mono',
          row.original.totalDamageDelta >= 0 ? 'text-primary' : 'text-destructive',
        )}
      >
        {formatSignedDamage(row.original.totalDamageDelta)}
      </Text>
    ),
  },
  {
    id: 'percent',
    header: () => <div className="text-right">% Delta</div>,
    meta: {
      headerClassName: 'w-[8rem] min-w-[8rem]',
      cellClassName: 'w-[8rem] min-w-[8rem]',
    },
    cell: ({ row }) => (
      <Text
        as="p"
        variant="bodySm"
        tabular={true}
        className={cn(
          'text-right font-mono',
          row.original.relativeDelta >= 0 ? 'text-primary' : 'text-destructive',
        )}
      >
        {formatPercentDelta(row.original.relativeDelta)}
      </Text>
    ),
  },
  {
    id: 'magnitude',
    header: () => {},
    meta: {
      headerClassName: 'w-[6rem] min-w-[6rem]',
      cellClassName: 'w-[6rem] min-w-[6rem]',
    },
    cell: ({ row }) => (
      <RelativeMagnitudeBar
        value={row.original.totalDamageDelta}
        maxValue={maxDeltaMagnitude}
        negative={row.original.totalDamageDelta < 0}
        twoSided={true}
      />
    ),
  },
];

const SensitivityAnalysisDetails = ({
  baselineTotalDamage,
  scenario,
}: {
  baselineTotalDamage: number;
  scenario: ClientSensitivityAnalysisScenario | undefined;
}) => {
  if (!scenario) {
    return (
      <Stack align="center" className="h-full justify-center">
        <Text variant="heading">No Scenario Selected</Text>
        <Text variant="bodySm" tone="muted">
          Click any sensitivity row to inspect its before-and-after totals here.
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap="component">
      <Stack gap="trim">
        <Text variant="overline" tone="muted">
          Sensitivity Scenario
        </Text>
        <Text variant="heading">{scenario.label}</Text>
        <Text variant="bodySm" tone="muted">
          {scenario.description}
        </Text>
      </Stack>
      <Stack gap="trim" className="rounded-lg border p-4">
        <Row justify="between">
          <Text variant="label">Baseline Damage</Text>
          <Text variant="bodySm" tabular={true} className="font-mono">
            {Math.round(baselineTotalDamage).toLocaleString()}
          </Text>
        </Row>
        <Row justify="between">
          <Text variant="label">Perturbed Damage</Text>
          <Text variant="bodySm" tabular={true} className="font-mono">
            {Math.round(scenario.perturbedTotalDamage).toLocaleString()}
          </Text>
        </Row>
        <Row justify="between">
          <Text variant="label">Delta</Text>
          <Text
            variant="bodySm"
            tabular={true}
            className={cn(
              'font-mono',
              scenario.totalDamageDelta >= 0 ? 'text-primary' : 'text-destructive',
            )}
          >
            {formatSignedDamage(scenario.totalDamageDelta)}
          </Text>
        </Row>
        <Row justify="between">
          <Text variant="label">% Delta</Text>
          <Text
            variant="bodySm"
            tabular={true}
            className={cn(
              'font-mono',
              scenario.relativeDelta >= 0 ? 'text-primary' : 'text-destructive',
            )}
          >
            {formatPercentDelta(scenario.relativeDelta)}
          </Text>
        </Row>
      </Stack>
    </Stack>
  );
};

export const SensitivityAnalysisTable = ({
  sensitivityAnalysis,
  inspectorPortalNode,
}: SensitivityAnalysisTableProperties) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | undefined>();
  const sections = buildSensitivitySections(sensitivityAnalysis);
  const selectedScenario = sensitivityAnalysis.scenarios.find(
    (scenario) => scenario.id === selectedScenarioId,
  );

  return (
    <Fragment>
      <Stack gap="component" className="min-h-0 flex-1 overflow-y-auto">
        {sections.map((section) => (
          <Stack key={section.category} gap="trim">
            <Text variant="overline" tone="muted">
              {section.title}
            </Text>
            {/*
             * Compare bars within each section so magnitude remains readable even when
             * different scenario categories operate on different numeric ranges.
             */}
            {(() => {
              const maxDeltaMagnitude = Math.max(
                ...section.rows.map((row) => Math.abs(row.totalDamageDelta)),
                0,
              );

              return (
                <DataTable
                  columns={createColumns(maxDeltaMagnitude)}
                  data={section.rows}
                  onRowClick={(row) => setSelectedScenarioId(row.id)}
                  emptyMessage={`No ${section.title.toLowerCase()} scenarios.`}
                  classNames={tableClassNames}
                />
              );
            })()}
          </Stack>
        ))}
      </Stack>

      {inspectorPortalNode
        ? createPortal(
            <SensitivityAnalysisDetails
              baselineTotalDamage={sensitivityAnalysis.baselineTotalDamage}
              scenario={selectedScenario}
            />,
            inspectorPortalNode,
          )
        : undefined}
    </Fragment>
  );
};
