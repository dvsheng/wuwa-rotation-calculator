import type { ColumnDef } from '@tanstack/react-table';
import { AlertCircle } from 'lucide-react';
import { useMemo } from 'react';

import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Stack } from '@/components/ui/layout';
import { Heading, Text } from '@/components/ui/typography';
import type { useRotationCalculation } from '@/hooks/useRotationCalculation';
import type { DetailedAttackInstance } from '@/hooks/useTeamAttackInstances';
import { useTeamAttackInstances } from '@/hooks/useTeamAttackInstances';
import type { ClientRotationResult } from '@/services/rotation-calculator/client-output-adapter/adapt-rotation-result-to-client-output';
import { useStore } from '@/store';

import { RotationResultRowHoverCard } from './RotationResultRowHoverCard';

interface RotationResultDisplayProperties {
  result: NonNullable<ReturnType<typeof useRotationCalculation>['data']>;
  isStale?: boolean;
}

type DamageDetail = ClientRotationResult['damageDetails'][number];

interface DamageRow {
  index: number;
  /** 0-based index into the stored attacks array. */
  attackIndex: number;
  /** 0-based hit number within the stored attack (for multi-hit attacks). */
  hitIndex: number;
  attack: DetailedAttackInstance | undefined;
  /** Resolved display name for the character that dealt this damage. */
  characterName: string;
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
  const teamSlots = useStore((state) => state.team);
  const { attacks: resolvedAttacks } = useTeamAttackInstances();

  // Map characterId → characterName for per-character tune break row labelling
  const characterIdToName = useMemo(
    () => new Map(resolvedAttacks.map((a) => [a.characterId, a.characterName])),
    [resolvedAttacks],
  );

  // Ordered by team slot so detail.characterIndex maps directly to a name
  const characterIndexToName = useMemo(
    () => teamSlots.map((c) => characterIdToName.get(c.id) ?? 'Unknown'),
    [teamSlots, characterIdToName],
  );

  const data: Array<DamageRow> = useMemo(() => {
    const attackMap = new Map(resolvedAttacks.map((a) => [a.instanceId, a]));
    const hitCountPerAttack = new Map<number, number>();

    return result.damageDetails.map((detail, index) => {
      const attack = attackMap.get(storedAttacks[detail.attackIndex]?.instanceId);
      const isTuneBreak = attack?.isTuneBreakAttack ?? false;
      const characterName = isTuneBreak
        ? (characterIndexToName[detail.characterIndex] ?? 'Unknown')
        : (attack?.characterName ?? 'Unknown');

      const hitIndex = hitCountPerAttack.get(detail.attackIndex) ?? 0;
      hitCountPerAttack.set(detail.attackIndex, hitIndex + 1);

      return {
        index,
        attackIndex: detail.attackIndex,
        hitIndex,
        attack,
        characterName,
        detail,
        damage: detail.damage,
      };
    });
  }, [result, storedAttacks, resolvedAttacks, characterIndexToName]);

  const columns = useMemo<Array<ColumnDef<DamageRow>>>(
    () => [
      {
        accessorKey: 'index',
        header: () => <div className="w-16 text-center">#</div>,
        cell: ({ row }) => {
          const { attackIndex, hitIndex } = row.original;
          return (
            <div className="text-muted-foreground w-16 text-center text-xs">
              {attackIndex + 1}
              <span className="text-muted-foreground/50"> ({hitIndex + 1})</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'characterName',
        header: 'Character',
        cell: ({ row }) => (
          <div className="text-foreground">{row.original.characterName}</div>
        ),
      },
      {
        accessorKey: 'attack',
        header: 'Attack',
        cell: ({ row }) => {
          const { attack } = row.original;
          if (!attack)
            return <div className="text-muted-foreground italic">Removed</div>;
          const isTuneBreak = attack.isTuneBreakAttack;
          return (
            <div className="max-w-72 truncate pr-2">
              <Text variant="small">
                {isTuneBreak ? 'Tune Break' : attack.parentName}
              </Text>
              {!isTuneBreak && (
                <Text variant="tiny" className="text-muted-foreground truncate">
                  {attack.name}
                </Text>
              )}
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
        cell: ({ row }) => (
          <div className="flex justify-center">
            <RotationResultRowHoverCard detail={row.original.detail} />
          </div>
        ),
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
