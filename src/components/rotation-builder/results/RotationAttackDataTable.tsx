import type { ColumnDef, Row } from '@tanstack/react-table';
import { Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Row as LayoutRow } from '@/components/ui/layout';
import { TableCell, TableRow } from '@/components/ui/table';
import { Text } from '@/components/ui/typography';
import type { DetailedAttackInstance } from '@/hooks/useTeamAttackInstances';
import type { ClientRotationResult } from '@/services/rotation-calculator/client-output-adapter/adapt-rotation-result-to-client-output';

import { rotationResultTableColumnLayout } from './rotation-result-table-column-layout';
import { useRotationResultPopover } from './RotationResultPopoverContext';

type DamageDetail = ClientRotationResult['damageDetails'][number];

export interface HitRow {
  hitIndex: number;
  detail: DamageDetail;
  damage: number;
}

export interface AttackGroup {
  attackIndex: number;
  attack: DetailedAttackInstance | undefined;
  characterName: string;
  hits: Array<HitRow>;
  totalDamage: number;
  pct: number;
}

interface RotationAttackDataTableProperties {
  row: Row<AttackGroup>;
  columnCount: number;
  isOpen: boolean;
}

export const RotationAttackDataTable = ({
  row: parentRow,
  columnCount,
  isOpen,
}: RotationAttackDataTableProperties) => {
  const { popoverSelection, setPopoverSelection } = useRotationResultPopover();
  if (!isOpen) {
    return;
  }

  const columns: Array<ColumnDef<HitRow>> = [
    {
      id: 'hit',
      header: 'Hit',
      meta: {
        headerClassName: rotationResultTableColumnLayout.index,
        cellClassName: rotationResultTableColumnLayout.index,
      },
      cell: ({ row }) => row.original.hitIndex + 1,
    },
    {
      id: 'attack-spacer',
      header: '',
      meta: {
        headerClassName: rotationResultTableColumnLayout.attack,
        cellClassName: rotationResultTableColumnLayout.attack,
      },
      cell: () => '',
    },
    {
      id: 'damage',
      header: () => <div className="text-right">Avg Dmg</div>,
      meta: {
        headerClassName: rotationResultTableColumnLayout.damage,
        cellClassName: rotationResultTableColumnLayout.damage,
      },
      cell: ({ row }) => {
        const motionValuePercentage = (row.original.detail.motionValue * 100).toFixed(
          1,
        );

        return (
          <LayoutRow justify="end" gap="tight" className="text-right font-mono">
            <Text variant="caption"> ({motionValuePercentage}%)</Text>
            <Text variant="small">
              {' '}
              {Math.round(row.original.damage).toLocaleString()}
            </Text>
          </LayoutRow>
        );
      },
    },
    {
      id: 'details',
      header: '',
      meta: {
        headerClassName: rotationResultTableColumnLayout.details,
        cellClassName: rotationResultTableColumnLayout.details,
      },
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() =>
              setPopoverSelection(
                popoverSelection?.attackIndex === parentRow.original.attackIndex &&
                  popoverSelection.hitIndex === row.original.hitIndex
                  ? undefined
                  : {
                      attackIndex: parentRow.original.attackIndex,
                      hitIndex: row.original.hitIndex,
                    },
              )
            }
            aria-label="Open damage details inspector"
          >
            <Info />
          </Button>
        </div>
      ),
    },
    {
      id: 'expand-spacer',
      header: '',
      meta: {
        headerClassName: rotationResultTableColumnLayout.expand,
        cellClassName: rotationResultTableColumnLayout.expand,
      },
      cell: () => '',
    },
  ];

  return (
    <TableRow className="border-b-0 hover:bg-transparent">
      <TableCell colSpan={columnCount} className="p-0 pb-3">
        <DataTable
          columns={columns}
          data={parentRow.original.hits}
          showHeader={false}
          classNames={{
            wrapper: 'border-0 bg-transparent',
            headerCell: 'text-xs font-semibold tracking-wider uppercase',
            row: 'cursor-pointer transition-colors',
          }}
        />
      </TableCell>
    </TableRow>
  );
};
