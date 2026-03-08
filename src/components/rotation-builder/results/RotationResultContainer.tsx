import { AlertCircle } from 'lucide-react';
import { useState } from 'react';

import { Container, Row, Stack } from '@/components/ui/layout';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/typography';
import type { useRotationCalculation } from '@/hooks/useRotationCalculation';
import { useTeamAttackInstances } from '@/hooks/useTeamAttackInstances';
import { useStore } from '@/store';

import type { AttackGroup } from './RotationAttackDataTable';
import { RotationResultDataTable } from './RotationResultDataTable';
import { RotationResultInspectorPanel } from './RotationResultInspectorPanel';
import type { RotationResultInspectorSelection } from './RotationResultPopoverContext';
import { RotationResultPopoverProvider } from './RotationResultPopoverContext';
import { RotationResultSummary } from './RotationResultSummary';

interface RotationResultContainerProperties {
  result: NonNullable<ReturnType<typeof useRotationCalculation>['data']>;
  isStale?: boolean;
}

export const RotationResultContainer = ({
  result,
  isStale,
}: RotationResultContainerProperties) => {
  const storedAttacks = useStore((state) => state.attacks);
  const { attacks: resolvedAttacks } = useTeamAttackInstances();
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [popoverSelection, setPopoverSelection] = useState<
    RotationResultInspectorSelection | undefined
  >();

  const attackMap = new Map(
    resolvedAttacks.map((attack) => [attack.instanceId, attack]),
  );
  const groupMap = new Map<number, AttackGroup>();
  const hitCountPerAttack = new Map<number, number>();

  for (const detail of result.damageDetails) {
    const storedAttack = storedAttacks[detail.attackIndex];
    const attack = attackMap.get(storedAttack.instanceId);
    const characterName = attack?.characterName ?? 'Unknown';

    const hitIndex = hitCountPerAttack.get(detail.attackIndex) ?? 0;
    hitCountPerAttack.set(detail.attackIndex, hitIndex + 1);

    const existingGroup = groupMap.get(detail.attackIndex);
    if (existingGroup) {
      existingGroup.hits.push({ hitIndex, detail, damage: detail.damage });
      existingGroup.totalDamage += detail.damage;
      continue;
    }

    groupMap.set(detail.attackIndex, {
      attackIndex: detail.attackIndex,
      attack,
      characterName,
      hits: [{ hitIndex, detail, damage: detail.damage }],
      totalDamage: detail.damage,
      pct: 0,
    });
  }

  const attackGroups = [...groupMap.values()];
  for (const group of attackGroups) {
    group.pct =
      result.totalDamage > 0 ? (group.totalDamage / result.totalDamage) * 100 : 0;
  }
  const groupByAttackIndex = new Map(
    attackGroups.map((group) => [group.attackIndex, group]),
  );
  const selectedDetail =
    popoverSelection === undefined
      ? undefined
      : groupByAttackIndex
          .get(popoverSelection.attackIndex)
          ?.hits.find((hit) => hit.hitIndex === popoverSelection.hitIndex)?.detail;

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

  return (
    <RotationResultPopoverProvider value={{ popoverSelection, setPopoverSelection }}>
      <Container className="h-full min-h-0">
        <Row align="stretch" className="h-full min-h-0">
          <Stack className="min-h-0 flex-1 overflow-hidden">
            <Row
              justify="between"
              align="center"
              className="canvas-header border-border px-panel border-b"
            >
              <Text as="span" variant="heading">
                Damage Table
              </Text>
              <Text as="span" variant="caption">
                {attackGroups.length} {attackGroups.length === 1 ? 'attack' : 'attacks'}
              </Text>
            </Row>
            <Stack gap="component" className="p-page min-h-0 flex-1">
              {isStale && (
                <Row className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-amber-500">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <Stack>
                    <Text variant="small" className="font-medium text-amber-500">
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
                attackCount={attackGroups.length}
                damageInstanceCount={result.damageDetails.length}
              />
              <Tabs
                defaultValue="data-table"
                className="min-h-0 flex-1 overflow-hidden"
              >
                <TabsList className="shrink-0">
                  <TabsTrigger value="data-table">Data Table</TabsTrigger>
                </TabsList>
                <TabsContent
                  value="data-table"
                  className="flex min-h-0 flex-1 overflow-hidden"
                >
                  <RotationResultDataTable
                    attackGroups={attackGroups}
                    expandedGroups={expandedGroups}
                    onToggleGroup={toggleGroup}
                  />
                </TabsContent>
              </Tabs>
            </Stack>
          </Stack>

          <Separator orientation="vertical" className="self-stretch" />
          <Stack className="min-h-0 w-2xl overflow-hidden">
            <Row
              justify="between"
              align="center"
              className="canvas-header border-border px-panel border-b"
            >
              <Text as="span" variant="heading">
                Details
              </Text>
              {selectedDetail ? (
                <Text as="span" variant="caption">
                  Attack #{popoverSelection ? popoverSelection.attackIndex + 1 : '--'} ·
                  Hit {popoverSelection ? popoverSelection.hitIndex + 1 : '--'}
                </Text>
              ) : (
                <Text as="span" variant="caption">
                  Select a row detail
                </Text>
              )}
            </Row>
            <Stack className="p-page min-h-0 flex-1 overflow-y-auto">
              {selectedDetail ? (
                <RotationResultInspectorPanel detail={selectedDetail} />
              ) : (
                <Stack className="h-full items-center justify-center">
                  <Text variant="heading">No Detail Selected</Text>
                  <Text variant="small">
                    Click Details on any row to view stat breakdown data here.
                  </Text>
                </Stack>
              )}
            </Stack>
          </Stack>
        </Row>
      </Container>
    </RotationResultPopoverProvider>
  );
};
