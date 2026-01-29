import type { ColumnDef } from '@tanstack/react-table';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useMemo } from 'react';

import { Card } from '@/components/ui/card';
import { Stack } from '@/components/ui/layout';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Heading, Text } from '@/components/ui/typography';
import type { AttackInstance } from '@/schemas/rotation';
import { getCalculateCharacterStatsForTag } from '@/services/rotation-calculator/calculate-stat-total';
import type { RotationResult } from '@/services/rotation-calculator/types';

interface RotationResultDisplayProps {
  result: RotationResult;
  attacks: Array<AttackInstance>;
}

type DamageDetail = RotationResult['damageDetails'][number];

interface DamageRow {
  index: number;
  attack: AttackInstance;
  detail: DamageDetail;
  damage: number;
}

/**
 * Displays the result of the rotation calculation using shadcn/ui Table components.
 */
export const RotationResultDisplay = ({
  result,
  attacks,
}: RotationResultDisplayProps) => {
  const data: Array<DamageRow> = useMemo(() => {
    return result.damageInstances.map((dmg, idx) => ({
      index: idx,
      attack: attacks[idx],
      detail: result.damageDetails[idx],
      damage: dmg,
    }));
  }, [result, attacks]);

  const columns = useMemo<Array<ColumnDef<DamageRow>>>(
    () => [
      {
        accessorKey: 'index',
        header: () => <div className="w-10 text-center">#</div>,
        cell: ({ row }) => (
          <div className="text-muted-foreground w-10 text-center font-mono text-xs">
            {row.original.index + 1}
          </div>
        ),
      },
      {
        accessorKey: 'characterName',
        header: 'Character',
        cell: ({ row }) => (
          <div className="text-primary/80 font-semibold">
            {row.original.attack.characterName}
          </div>
        ),
      },
      {
        accessorKey: 'attack',
        header: 'Attack',
        cell: ({ row }) => {
          const attack = row.original.attack;
          return (
            <div className="max-w-[300px] truncate pr-2">
              <Text variant="small" className="font-medium">
                {attack.parentName}
              </Text>
              <Text variant="tiny" className="text-muted-foreground truncate">
                {attack.name}
              </Text>
            </div>
          );
        },
      },
      {
        accessorKey: 'damage',
        header: () => <div className="text-right">Average Damage</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono font-bold">
            {Math.round(row.original.damage).toLocaleString()}
          </div>
        ),
      },
    ],
    [],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card className="border-primary/20 bg-primary/5 p-6">
      <Stack spacing="lg">
        <div className="border-primary/10 flex items-center justify-between border-b pb-4">
          <div>
            <Text
              variant="small"
              className="text-muted-foreground font-bold tracking-wider uppercase"
            >
              Total Rotation Damage
            </Text>
            <Heading level={1} className="text-primary text-4xl">
              {Math.round(result.totalDamage).toLocaleString()}
            </Heading>
          </div>
          <div className="text-right">
            <Text
              variant="small"
              className="text-muted-foreground font-bold tracking-wider uppercase"
            >
              DPS (approx)
            </Text>
            <Heading level={2} className="text-2xl">
              {Math.round(result.totalDamage / (attacks.length || 1)).toLocaleString()}
            </Heading>
          </div>
        </div>

        <div className="bg-card/50 overflow-hidden rounded-lg border">
          <ScrollArea className="max-h-[400px]">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent">
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="text-[10px] font-bold tracking-wider uppercase"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => {
                  const { detail, attack } = row.original;
                  const charName = attack.characterName;

                  return (
                    <Tooltip key={row.id}>
                      <TooltipTrigger asChild>
                        <TableRow className="hover:bg-muted/30 cursor-help transition-colors">
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="w-80 border-white/10 bg-zinc-900 p-0 text-zinc-100 shadow-xl"
                      >
                        <div className="border-b border-white/10 bg-zinc-800/50 p-2">
                          <Text
                            variant="tiny"
                            className="font-bold tracking-wider text-zinc-300 uppercase"
                          >
                            Calculation Details
                          </Text>
                        </div>
                        <div className="space-y-3 p-3">
                          <div className="rounded border border-white/5 bg-white/5 p-2">
                            <Text
                              variant="tiny"
                              className="mb-1 font-bold text-blue-400 uppercase"
                            >
                              Character Stats
                            </Text>
                            <div className="grid grid-cols-2 gap-x-2 text-[10px]">
                              {(() => {
                                const char = detail.team.find((c) => c.id === charName);
                                if (!char) return null;

                                const calculateStats = getCalculateCharacterStatsForTag(
                                  detail.instance.tags,
                                );
                                const stats = calculateStats(char.stats);

                                return (
                                  <>
                                    <span className="text-zinc-400">
                                      Attack (Total):
                                    </span>
                                    <span className="text-right font-medium text-zinc-100">
                                      {Math.round(stats.atk)}
                                    </span>
                                    <span className="text-zinc-400">Crit Rate:</span>
                                    <span className="text-right font-medium text-zinc-100">
                                      {(stats.criticalRate * 100).toFixed(1)}%
                                    </span>
                                    <span className="text-zinc-400">Crit Damage:</span>
                                    <span className="text-right font-medium text-zinc-100">
                                      {(stats.criticalDamage * 100).toFixed(1)}%
                                    </span>
                                    <span className="text-zinc-400">Damage Bonus:</span>
                                    <span className="text-right font-medium text-zinc-100">
                                      {(stats.damageBonus * 100).toFixed(1)}%
                                    </span>
                                    <span className="text-zinc-400">
                                      Defense Ignore:
                                    </span>
                                    <span className="text-right font-medium text-zinc-100">
                                      {(stats.defenseIgnore * 100).toFixed(1)}%
                                    </span>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                          <div className="rounded border border-white/5 bg-white/5 p-2">
                            <Text
                              variant="tiny"
                              className="mb-1 font-bold text-blue-400 uppercase"
                            >
                              Instance Stats
                            </Text>
                            <div className="grid grid-cols-2 gap-x-2 text-[10px]">
                              <span className="text-zinc-400">Scaling:</span>
                              <span className="text-right font-medium text-zinc-100 uppercase">
                                {detail.instance.scalingStat}
                              </span>
                              <span className="text-zinc-400">Attribute:</span>
                              <span className="text-right font-medium text-zinc-100 uppercase">
                                {detail.instance.attribute}
                              </span>
                              <span className="text-zinc-400">MV:</span>
                              <span className="truncate text-right font-medium text-zinc-100">
                                {detail.instance.motionValues.join(', ')}
                              </span>
                              <span className="text-zinc-400">Tags:</span>
                              <span className="truncate text-right font-medium text-zinc-100">
                                {detail.instance.tags.join(', ')}
                              </span>
                            </div>
                          </div>
                          <div className="rounded border border-white/5 bg-white/5 p-2">
                            <Text
                              variant="tiny"
                              className="mb-1 font-bold text-blue-400 uppercase"
                            >
                              Enemy Stats
                            </Text>
                            <div className="grid grid-cols-2 gap-x-2 text-[10px]">
                              <span className="text-zinc-400">Level:</span>
                              <span className="text-right font-medium text-zinc-100">
                                {detail.enemy.level}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </Stack>
    </Card>
  );
};
