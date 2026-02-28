import type { ColumnDef } from '@tanstack/react-table';
import { AlertCircle, Info } from 'lucide-react';
import { Fragment, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Stack } from '@/components/ui/layout';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Heading, Text } from '@/components/ui/typography';
import type { useRotationCalculation } from '@/hooks/useRotationCalculation';
import type { DetailedAttackInstance } from '@/hooks/useTeamAttackInstances';
import { useTeamAttackInstances } from '@/hooks/useTeamAttackInstances';
import type { RotationResult } from '@/services/rotation-calculator/core/types';
import { useStore } from '@/store';

interface RotationResultDisplayProperties {
  result: NonNullable<ReturnType<typeof useRotationCalculation>['data']>;
  isStale?: boolean;
}

type DamageDetail = RotationResult['damageDetails'][number];

interface DamageRow {
  index: number;
  attack: DetailedAttackInstance | undefined;
  detail: DamageDetail;
  damage: number;
}

/**
 * Displays the result of the rotation calculation using shadcn/ui Table components.
 */
export const RotationResultDisplay = ({
  result,
  isStale,
}: RotationResultDisplayProperties) => {
  const storedAttacks = useStore((state) => state.attacks);
  const { attacks: resolvedAttacks } = useTeamAttackInstances();

  const data: Array<DamageRow> = useMemo(() => {
    // Build a map from instanceId to resolved attack for quick lookup
    const attackMap = new Map(resolvedAttacks.map((a) => [a.instanceId, a]));

    return result.damageDetails.map((detail, index) => ({
      index,
      attack: attackMap.get(storedAttacks[detail.attackIndex]?.instanceId),
      detail,
      damage: detail.damage,
    }));
  }, [result, storedAttacks, resolvedAttacks]);

  const columns = useMemo<Array<ColumnDef<DamageRow>>>(
    () => [
      {
        accessorKey: 'index',
        header: () => <div className="w-10 text-center">#</div>,
        cell: ({ row }) => (
          <div className="text-muted-foreground w-10 text-center text-xs">
            {row.original.index + 1}
          </div>
        ),
      },
      {
        accessorKey: 'characterName',
        header: 'Character',
        cell: ({ row }) => (
          <div className="text-foreground">
            {row.original.attack?.characterName ?? 'Unknown'}
          </div>
        ),
      },
      {
        accessorKey: 'attack',
        header: 'Attack',
        cell: ({ row }) => {
          const attack = row.original.attack;
          if (!attack)
            return <div className="text-muted-foreground italic">Removed</div>;
          return (
            <div className="max-w-72 truncate pr-2">
              <Text variant="small">{attack.parentName}</Text>
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
          <div className="text-right">
            {Math.round(row.original.damage).toLocaleString()}
          </div>
        ),
      },
      {
        id: 'details',
        header: () => <div className="text-center">Details</div>,
        cell: ({ row }) => {
          const { detail } = row.original;
          return (
            <div className="flex justify-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label="View details">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="w-96 border-white/10 bg-zinc-900 p-0 text-zinc-100 shadow-xl"
                >
                  <div className="border-b border-white/10 bg-zinc-800/50 p-3">
                    <Text
                      variant="tiny"
                      className="font-semibold tracking-wider text-zinc-300 uppercase"
                    >
                      Calculation Snapshot
                    </Text>
                  </div>

                  <ScrollArea className="max-h-96 p-3">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Text
                          variant="tiny"
                          className="font-semibold text-amber-500 uppercase"
                        >
                          Skill
                        </Text>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                          <span className="text-zinc-400">Base Damage</span>
                          <span className="text-right font-mono text-zinc-100">
                            {`${detail.baseDamage}`}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Text
                          variant="tiny"
                          className="font-semibold text-blue-400 uppercase"
                        >
                          Character Stats
                        </Text>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                          {Object.entries(detail.character).map(([key, value]) => (
                            <Fragment key={key}>
                              <span className="text-zinc-400 capitalize">
                                {key.replaceAll(/([A-Z])/g, ' $1').trim()}
                              </span>
                              <span className="text-right font-mono text-zinc-100">
                                {[
                                  'level',
                                  'attackScalingPropertyValue',
                                  'flatDamage',
                                ].includes(key)
                                  ? Math.round(value).toLocaleString()
                                  : `${(value * 100).toFixed(1)}%`}
                              </span>
                            </Fragment>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Text
                          variant="tiny"
                          className="font-semibold text-red-400 uppercase"
                        >
                          Enemy Stats
                        </Text>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                          {Object.entries(detail.enemy).map(([key, value]) => (
                            <Fragment key={key}>
                              <span className="text-zinc-400 capitalize">
                                {key.replaceAll(/([A-Z])/g, ' $1').trim()}
                              </span>
                              <span className="text-right font-mono text-zinc-100">
                                {key === 'level'
                                  ? Math.round(value).toLocaleString()
                                  : `${(value * 100).toFixed(1)}%`}
                              </span>
                            </Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </TooltipContent>
              </Tooltip>
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <Card className="border-primary/20 bg-primary/5 overflow-hidden p-6">
      <Stack spacing="lg">
        {isStale && (
          <div className="mb-2 flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-amber-500">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div className="flex-1">
              <Text variant="small" className="text-amber-500">
                Outdated Result
              </Text>
              <Text variant="tiny" className="text-amber-500/80">
                The rotation has changed. Recalculate to see updated damage.
              </Text>
            </div>
          </div>
        )}

        <div className="border-primary/10 flex items-center justify-between border-b pb-4">
          <div>
            <Text
              variant="small"
              className="text-muted-foreground font-semibold tracking-wider uppercase"
            >
              Total Rotation Damage
            </Text>
            <Heading level={1} className="text-primary text-4xl">
              {Math.round(result.totalDamage).toLocaleString()}
            </Heading>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={data}
          classNames={{
            wrapper: 'bg-card/50 border-0 min-w-0',
            scrollArea: 'max-h-[400px]',
            header: 'bg-muted/50 sticky top-0 z-10',
            headerRow: 'hover:bg-transparent',
            headerCell: 'text-xs font-semibold tracking-wider uppercase',
            row: 'hover:bg-muted/30 transition-colors',
          }}
        />
      </Stack>
    </Card>
  );
};
