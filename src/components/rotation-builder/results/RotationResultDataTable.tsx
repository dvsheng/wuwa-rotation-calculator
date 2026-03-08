import type { ColumnDef } from '@tanstack/react-table';
import { ChevronDown, Info } from 'lucide-react';
import { Fragment } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Row, Stack } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

import { rotationResultTableColumnLayout } from './rotation-result-table-column-layout';
import type { AttackGroup } from './RotationAttackDataTable';
import { RotationAttackDataTable } from './RotationAttackDataTable';
import { useRotationResultPopover } from './RotationResultPopoverContext';

interface RotationResultDataTableProperties {
  attackGroups: Array<AttackGroup>;
  expandedGroups: Set<number>;
  onToggleGroup: (attackIndex: number) => void;
}

export const RotationResultDataTable = ({
  attackGroups,
  expandedGroups,
  onToggleGroup,
}: RotationResultDataTableProperties) => {
  const { popoverSelection, setPopoverSelection } = useRotationResultPopover();

  const columns: Array<ColumnDef<AttackGroup>> = [
    {
      id: 'index',
      header: 'Attack #',
      meta: {
        headerClassName: rotationResultTableColumnLayout.index,
        cellClassName: rotationResultTableColumnLayout.index,
      },
      cell: ({ row }) => (
        <Text variant="small" className="justify-center font-mono">
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
                <Text as="span" variant="caption">
                  {attack.parentName}
                </Text>
                <Row>
                  <Text as="p" variant="small" className="text-foreground">
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
          <Text as="p" variant="small" className="text-foreground text-right font-mono">
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
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(event) => {
                event.stopPropagation();
                setPopoverSelection(
                  popoverSelection?.attackIndex === row.original.attackIndex &&
                    popoverSelection.hitIndex === 0
                    ? undefined
                    : {
                        attackIndex: row.original.attackIndex,
                        hitIndex: 0,
                      },
                );
              }}
              aria-label="Open damage details inspector"
            >
              <Info />
            </Button>
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
  ];

  return (
    <DataTable
      columns={columns}
      data={attackGroups}
      onRowClick={(group) => onToggleGroup(group.attackIndex)}
      emptyMessage="No damage instances."
      classNames={{
        wrapper: 'bg-card min-w-0 rounded-lg w-full',
        scrollArea:
          'h-full min-h-0 overflow-hidden [&>div]:h-full [&>div]:overflow-auto',
        headerRow: 'hover:bg-transparent',
        headerCell:
          'sticky top-0 z-20 bg-muted/90 text-xs font-semibold tracking-wider uppercase backdrop-blur-sm',
        row: 'cursor-pointer transition-colors',
        cell: 'py-compact',
      }}
      renderRow={(row, defaultRow) => (
        <Fragment key={row.id}>
          {defaultRow}
          <RotationAttackDataTable
            row={row}
            columnCount={columns.length}
            isOpen={expandedGroups.has(row.original.attackIndex)}
          />
        </Fragment>
      )}
    />
  );
};
