import type { ColumnDef } from '@tanstack/react-table';
import { ChevronDown } from 'lucide-react';
import { Fragment, useState } from 'react';
import { createPortal } from 'react-dom';

import { InfoTooltip } from '@/components/common/InfoTooltip';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Row, Stack } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';
import type { RotationResultMergedDamageDetail } from '@/hooks/useRotationCalculation';
import { cn } from '@/lib/utils';

import { AttackBreakdownRowDropdown } from './AttackBreakdownRowDropdown';
import type { AttackGroup } from './AttackBreakdownRowDropdown';
import { AttackCalculationStatsBreakdown } from './AttackCalculationStatsBreakdown';
import {
  rotationResultDataTableClassNames,
  rotationResultTableColumnLayout,
} from './data-table.style';
import { RelativeMagnitudeBar } from './RelativeMagnitudeBar';
import { attackGroups as buildAttackGroups } from './result-pipelines';

type DamageDetail = Parameters<typeof AttackCalculationStatsBreakdown>[0]['detail'];

interface AttackBreakdownDataTableProperties {
  mergedDamageDetails: Array<RotationResultMergedDamageDetail>;
  inspectorPortalNode: HTMLDivElement | undefined;
}

export const AttackBreakdownDataTable = ({
  mergedDamageDetails,
  inspectorPortalNode,
}: AttackBreakdownDataTableProperties) => {
  const [selectedDetail, setSelectedDetail] = useState<DamageDetail | undefined>();
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());

  const toggleGroup = (attackIndex: number) => {
    setExpandedGroups((previous) => {
      const next = new Set(previous);
      if (next.has(attackIndex)) {
        next.delete(attackIndex);
      } else {
        next.add(attackIndex);
      }
      return next;
    });
  };

  const attackGroups = buildAttackGroups(mergedDamageDetails);
  const maxDamage = Math.max(...attackGroups.map((group) => group.totalDamage), 0);

  const columns: Array<ColumnDef<AttackGroup>> = [
    {
      id: 'index',
      header: 'Attack #',
      meta: {
        headerClassName: rotationResultTableColumnLayout.index,
        cellClassName: rotationResultTableColumnLayout.index,
      },
      cell: ({ row }) => (
        <Text
          variant="bodySm"
          tabular={true}
          className="text-primary justify-center font-mono"
        >
          {row.original.attackIndex + 1}
        </Text>
      ),
    },
    {
      id: 'attack',
      header: 'Attack Name',
      meta: {
        headerClassName: rotationResultTableColumnLayout.attack,
        cellClassName: rotationResultTableColumnLayout.attack,
      },
      cell: ({ row }) => {
        const { attack, hits } = row.original;
        return (
          <div className="min-w-0">
            {attack ? (
              <Stack>
                <Text as="span" variant="caption" tone="muted">
                  {attack.parentName}
                </Text>
                <Row>
                  <Text as="p" variant="bodySm">
                    {attack.name}
                  </Text>
                  {hits.length > 1 && (
                    <Badge variant="secondary">{hits.length} hits</Badge>
                  )}
                </Row>
              </Stack>
            ) : undefined}
          </div>
        );
      },
    },
    {
      id: 'damage',
      header: () => <div className="text-right"> Damage </div>,
      meta: {
        headerClassName: rotationResultTableColumnLayout.damage,
        cellClassName: rotationResultTableColumnLayout.damage,
      },
      cell: ({ row }) => {
        const { totalDamage } = row.original;
        return (
          <Text
            as="p"
            variant="bodySm"
            tabular={true}
            className="text-primary text-right font-mono"
          >
            {Math.round(totalDamage).toLocaleString()}
          </Text>
        );
      },
    },
    {
      id: 'details',
      header: () => {},
      meta: {
        headerClassName: rotationResultTableColumnLayout.details,
        cellClassName: rotationResultTableColumnLayout.details,
      },
      cell: ({ row }) => {
        return (
          <div className="flex justify-end">
            <InfoTooltip
              onClick={(event) => {
                // Keep the table row collapsed/expanded state unchanged when opening the inspector.
                event.stopPropagation();
                setSelectedDetail(row.original.hits[0]?.detail);
              }}
            >
              Open damage details inspector
            </InfoTooltip>
          </div>
        );
      },
    },
    {
      id: 'expand',
      header: () => {},
      meta: {
        headerClassName: rotationResultTableColumnLayout.expand,
        cellClassName: rotationResultTableColumnLayout.expand,
      },
      cell: ({ row }) => (
        <ChevronDown
          className={cn(
            'h-4 w-4',
            expandedGroups.has(row.original.attackIndex) && 'rotate-180',
          )}
        />
      ),
    },
    {
      id: 'magnitude',
      header: () => {},
      meta: {
        headerClassName: rotationResultTableColumnLayout.magnitude,
        cellClassName: rotationResultTableColumnLayout.magnitude,
      },
      cell: ({ row }) => (
        <RelativeMagnitudeBar value={row.original.totalDamage} maxValue={maxDamage} />
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={attackGroups}
        onRowClick={(group) => toggleGroup(group.attackIndex)}
        emptyMessage="No damage instances."
        classNames={rotationResultDataTableClassNames}
        renderRow={(row, defaultRow) => (
          <Fragment key={row.id}>
            {defaultRow}
            <AttackBreakdownRowDropdown
              row={row}
              columnCount={columns.length}
              isOpen={expandedGroups.has(row.original.attackIndex)}
              onSelect={setSelectedDetail}
            />
          </Fragment>
        )}
      />
      {inspectorPortalNode
        ? createPortal(
            selectedDetail ? (
              <AttackCalculationStatsBreakdown detail={selectedDetail} />
            ) : (
              <Stack align="center" className="h-full justify-center">
                <Text variant="heading">No Detail Selected</Text>
                <Text variant="bodySm" tone="muted">
                  Click Details on any row to view stat breakdown data here.
                </Text>
              </Stack>
            ),
            inspectorPortalNode,
          )
        : undefined}
    </>
  );
};
