/* eslint-disable unicorn/filename-case */
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { groupBy, startCase } from 'es-toolkit';
import { Cat, User, Users } from 'lucide-react';
import React, { Suspense } from 'react';
import { z } from 'zod';

import { AttributeIcon } from '@/components/common/AssetIcon';
import { InfoTooltip } from '@/components/common/InfoTooltip';
import { LoadingSpinnerContainer } from '@/components/common/LoadingSpinnerContainer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Container, Stack } from '@/components/ui/layout';
import { TableCell, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEntityAttacks } from '@/hooks/useEntityAttacks';
import { useEntityBuffs } from '@/hooks/useEntityBuffs';
import { useEntityDamageInstances } from '@/hooks/useEntityDamageInstances';
import { useEntityModifiers } from '@/hooks/useEntityModifiers';
import { useGameDataEntities } from '@/hooks/useGameDataEntities';
import type { EntityType } from '@/services/game-data/types';
import { Target } from '@/services/game-data/types';
import type { EntityAttack } from '@/services/game-data-v2/attacks';
import type { Buff } from '@/services/game-data-v2/buffs';
import type { DamageInstance } from '@/services/game-data-v2/damage-instances/types';
import type { Modifier } from '@/services/game-data-v2/modifiers';
import { Attribute } from '@/types/attribute';

type NumberNode = Buff['value'];
type DescriptionBlock = {
  style: 'title' | 'body';
  text: string;
};

type StackInfo = { valueAt1: number; valueAtMax: number; maxStacks: number };
type ClampInfo = { min: number; max: number; stat: string | undefined };

function findStatParameter(node: NumberNode): string | undefined {
  if (typeof node === 'number') return undefined;
  if (node.type === 'statParameterizedNumber') return node.stat;
  if (node.type === 'clamp') return findStatParameter(node.operand);
  if (node.type === 'product' || node.type === 'sum') {
    for (const op of node.operands) {
      const found = findStatParameter(op);
      if (found) return found;
    }
  }
  if (node.type === 'conditional') {
    return (
      findStatParameter(node.operand) ??
      findStatParameter(node.valueIfTrue) ??
      findStatParameter(node.valueIfFalse)
    );
  }
  return undefined;
}

function extractClampInfo(value: NumberNode): ClampInfo | undefined {
  if (
    typeof value !== 'object' ||
    value === null ||
    value.type !== 'clamp' ||
    typeof value.minimum !== 'number' ||
    typeof value.maximum !== 'number'
  )
    return undefined;
  return {
    min: value.minimum,
    max: value.maximum,
    stat: findStatParameter(value.operand),
  };
}

function extractStackInfo(value: NumberNode): StackInfo | undefined {
  if (typeof value !== 'object' || value === null) return undefined;

  if (
    value.type === 'userParameterizedNumber' &&
    value.scale !== undefined &&
    typeof value.maximum === 'number'
  ) {
    return {
      valueAt1: value.scale,
      valueAtMax: value.scale * value.maximum,
      maxStacks: value.maximum,
    };
  }

  if (value.type === 'product' && Array.isArray(value.operands)) {
    const stacker = value.operands.find(
      (op): op is Extract<NumberNode, { type: 'userParameterizedNumber' }> =>
        typeof op === 'object' &&
        op !== null &&
        'type' in op &&
        op.type === 'userParameterizedNumber',
    );
    const scalar = value.operands.find((op): op is number => typeof op === 'number');
    if (stacker && scalar !== undefined && typeof stacker.maximum === 'number') {
      return {
        valueAt1: scalar,
        valueAtMax: scalar * stacker.maximum,
        maxStacks: stacker.maximum,
      };
    }
  }

  return undefined;
}

function fmt(n: number) {
  return `${(n * 100).toFixed(2)}%`;
}

function normalizeInputPrompt(text: string) {
  return text
    .replaceAll(/\{Cus:Ipt,[^}]*PC=([^ }\n]+)[^}]*\}/g, '$1')
    .replaceAll(
      /\{Cus:Sap,[^}]*S=([^ }\n]+)[^}]*P=([^ }\n]+)[^}]*\}/g,
      (_match, singular: string, plural: string) => plural || singular,
    );
}

function splitDescriptionSentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

function parseDescription(description: string): Array<DescriptionBlock> {
  const normalized = normalizeInputPrompt(description)
    .replaceAll('<size=10></size>', '\n\n')
    .replaceAll(
      /<size=40><color=Title>(.*?)<\/color><\/size>/g,
      '\n\n__TITLE__$1__ENDTITLE__\n\n',
    )
    .replaceAll(/<te href=\d+>(.*?)<\/te>/g, '$1')
    .replaceAll(/<color=[^>]+>(.*?)<\/color>/g, '$1')
    .replaceAll(/<\/?size[^>]*>/g, '')
    .replaceAll(/<\/?color[^>]*>/g, '')
    .replaceAll(/<[^>]+>/g, '')
    .replaceAll(/[ \t]+\n/g, '\n')
    .replaceAll(/\n{3,}/g, '\n\n')
    .trim();

  return normalized.split(/\n{2,}/).flatMap((block) => {
    const trimmed = block.trim();
    if (trimmed.length === 0) return [];

    const titleMatch = trimmed.match(/^__TITLE__(.*?)__ENDTITLE__$/);
    if (titleMatch) {
      return [{ style: 'title' as const, text: titleMatch[1].trim() }];
    }

    return splitDescriptionSentences(trimmed).map((sentence) => ({
      style: 'body' as const,
      text: sentence,
    }));
  });
}

function Description({ text }: { text: string }) {
  const blocks = parseDescription(text);

  return (
    <div className="space-y-2">
      {blocks.map((block, index) =>
        block.style === 'title' ? (
          <p key={`${block.style}-${index}`} className="font-semibold">
            {block.text}
          </p>
        ) : (
          <p key={`${block.style}-${index}`} className="text-muted-foreground text-sm">
            {block.text}
          </p>
        ),
      )}
    </div>
  );
}

const HoverJson = ({
  value,
  children,
}: {
  value: unknown;
  children: React.ReactNode;
}) => (
  <HoverCard openDelay={150} closeDelay={100}>
    <HoverCardTrigger className="cursor-help underline decoration-dashed underline-offset-4">
      {children}
    </HoverCardTrigger>
    <HoverCardContent className="w-fit max-w-3xl overflow-hidden p-0">
      <div className="max-h-96 max-w-3xl overflow-auto">
        <pre className="w-fit min-w-full p-4 text-xs">
          {JSON.stringify(value, null, 4)}
        </pre>
      </div>
    </HoverCardContent>
  </HoverCard>
);

function BuffValue({ value }: { value: NumberNode }) {
  if (typeof value === 'number') {
    return <span>{fmt(value)}</span>;
  }

  const stackInfo = extractStackInfo(value);
  if (stackInfo) {
    return (
      <HoverJson value={value}>
        {fmt(stackInfo.valueAt1)} – {fmt(stackInfo.valueAtMax)}
        <span className="text-muted-foreground ml-1 text-sm font-normal">
          ({stackInfo.maxStacks} stacks)
        </span>
      </HoverJson>
    );
  }

  const clampInfo = extractClampInfo(value);
  if (clampInfo) {
    return (
      <HoverJson value={value}>
        {fmt(clampInfo.min)} – {fmt(clampInfo.max)}
        {clampInfo.stat && (
          <span className="text-muted-foreground ml-1 text-sm font-normal">
            ({startCase(clampInfo.stat)})
          </span>
        )}
      </HoverJson>
    );
  }

  return <HoverJson value={value}>Dynamic</HoverJson>;
}

const TARGET_ICON: Record<string, React.ReactNode> = {
  [Target.TEAM]: <Users className="h-3 w-3" />,
  [Target.SELF]: <User className="h-3 w-3" />,
  [Target.ACTIVE_CHARACTER]: <User className="h-3 w-3" />,
  [Target.ENEMY]: <Cat className="h-3 w-3" />,
};

function TargetBadge({ target }: { target: string }) {
  return (
    <span className="flex items-center gap-1 text-sm">
      {TARGET_ICON[target]}
      {startCase(target)}
    </span>
  );
}

function BuffTags({ tags }: { tags: Array<string> }) {
  if (tags.length === 0) {
    return <span className="text-muted-foreground text-sm">None</span>;
  }

  return (
    <div className="flex flex-wrap gap-x-2 gap-y-1">
      {tags.map((tag) => {
        const isAttribute = (Object.values(Attribute) as Array<string>).includes(tag);
        const isNonPhysicalAttribute = isAttribute && tag !== Attribute.PHYSICAL;
        return (
          <span key={tag} className="flex items-center gap-1 text-sm">
            {isNonPhysicalAttribute && (
              <AttributeIcon
                attribute={
                  tag as Exclude<
                    (typeof Attribute)[keyof typeof Attribute],
                    'physical'
                  >
                }
                size={12}
              />
            )}
            {startCase(tag)}
          </span>
        );
      })}
    </div>
  );
}

function EntityBuffsList({ id, entityType }: { id: number; entityType: EntityType }) {
  const { data } = useEntityBuffs(id, entityType);

  if (data.length === 0) {
    return <p className="text-muted-foreground text-sm">No buffs found.</p>;
  }

  const columns: Array<ColumnDef<Buff>> = [
    {
      id: 'raw',
      header: '',
      cell: ({ row }) => (
        <HoverJson value={row.original.rawData}>
          <span className="text-xs">raw</span>
        </HoverJson>
      ),
      meta: {
        headerClassName: 'w-10',
        cellClassName: 'w-10',
      },
    },
    {
      id: 'value',
      header: 'Value',
      cell: ({ row }) => <BuffValue value={row.original.value} />,
      meta: {
        headerClassName: 'min-w-28',
        cellClassName: 'min-w-28 font-mono text-sm',
      },
    },
    {
      accessorKey: 'stat',
      header: 'Stat',
      cell: ({ row }) => startCase(row.original.stat),
      meta: {
        headerClassName: 'min-w-28',
        cellClassName: 'min-w-28',
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) =>
        row.original.type ? (
          <span className="text-sm">{startCase(row.original.type)}</span>
        ) : (
          <span className="text-muted-foreground text-sm">None</span>
        ),
      meta: {
        headerClassName: 'min-w-24',
        cellClassName: 'min-w-24',
      },
    },
    {
      accessorKey: 'target',
      header: 'Target',
      cell: ({ row }) =>
        row.original.target ? (
          <TargetBadge target={row.original.target} />
        ) : (
          <span className="text-muted-foreground text-sm">None</span>
        ),
      meta: {
        headerClassName: 'min-w-24',
        cellClassName: 'min-w-24',
      },
    },
    {
      accessorKey: 'duration',
      header: 'Duration',
      cell: ({ row }) =>
        row.original.duration === undefined ? (
          <span className="text-muted-foreground text-sm">Permanent</span>
        ) : (
          `${row.original.duration}s`
        ),
      meta: {
        headerClassName: 'min-w-20',
        cellClassName: 'min-w-20',
      },
    },
    {
      accessorKey: 'unlockedAt',
      header: 'Unlocked At',
      cell: ({ row }) =>
        row.original.unlockedAt ? (
          <span className="text-sm">{row.original.unlockedAt.toUpperCase()}</span>
        ) : (
          <span className="text-muted-foreground text-sm">Base</span>
        ),
      meta: {
        headerClassName: 'min-w-24',
        cellClassName: 'min-w-24',
      },
    },
    {
      accessorKey: 'disabledAt',
      header: 'Disabled At',
      cell: ({ row }) =>
        row.original.disabledAt ? (
          <span className="text-sm">{row.original.disabledAt.toUpperCase()}</span>
        ) : (
          <span className="text-muted-foreground text-sm">Never</span>
        ),
      meta: {
        headerClassName: 'min-w-24',
        cellClassName: 'min-w-24',
      },
    },
    {
      accessorKey: 'tags',
      header: 'Applies To',
      cell: ({ row }) => <BuffTags tags={row.original.tags} />,
      meta: {
        headerClassName: 'min-w-40',
        cellClassName: 'min-w-40',
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      classNames={{
        wrapper: 'bg-muted/30 rounded-md border',
      }}
    />
  );
}

function EntityModifiersList({
  id,
  entityType,
}: {
  id: number;
  entityType: EntityType;
}) {
  const { data } = useEntityModifiers(id, entityType);

  if (data.length === 0) {
    return <p className="text-muted-foreground text-sm">No modifiers found.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {data.map((modifier, index) => (
        <ModifierCard
          key={modifier.buffs.map((buff) => buff.buffId).join('-') || `modifier-${index}`}
          modifier={modifier}
          index={index}
        />
      ))}
    </div>
  );
}

function ModifierCard({
  modifier,
  index,
}: {
  modifier: Modifier;
  index: number;
}) {
  const modifierTargets = [
    ...new Set(
      modifier.buffs.flatMap((buff) => (buff.target ? [buff.target] : [])),
    ),
  ];
  const modifierDurations = [...new Set(modifier.buffs.map((buff) => buff.duration))];

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 py-4">
        <div className="space-y-2">
          <CardTitle className="text-base">Modifier {index + 1}</CardTitle>
          <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="outline">{modifier.buffs.length} buffs</Badge>
            {modifierTargets.map((target) => (
              <Badge key={target} variant="secondary" className="gap-1">
                {TARGET_ICON[target]}
                {startCase(target)}
              </Badge>
            ))}
            {modifierDurations.map((duration) => (
              <Badge key={String(duration)} variant="secondary">
                {duration === undefined ? 'Permanent' : `${duration}s`}
              </Badge>
            ))}
          </div>
        </div>
        <HoverJson value={modifier}>
          <span className="text-muted-foreground text-xs">raw</span>
        </HoverJson>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-0 pb-4">
        {modifier.buffs.map((buff) => (
          <div
            key={buff.buffId}
            className="bg-muted/30 flex flex-col gap-3 rounded-md border p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {buff.buffId}
              </Badge>
              <Badge variant="secondary">{startCase(buff.stat)}</Badge>
              {buff.type && <Badge variant="secondary">{startCase(buff.type)}</Badge>}
              {buff.target && (
                <Badge variant="secondary" className="gap-1">
                  {TARGET_ICON[buff.target]}
                  {startCase(buff.target)}
                </Badge>
              )}
              <Badge variant="secondary">
                {buff.duration === undefined ? 'Permanent' : `${buff.duration}s`}
              </Badge>
              {buff.unlockedAt && (
                <Badge variant="secondary">{buff.unlockedAt.toUpperCase()}</Badge>
              )}
              {buff.disabledAt && (
                <Badge variant="secondary">{buff.disabledAt.toUpperCase()}</Badge>
              )}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Value
                </p>
                <div className="font-mono text-sm">
                  <BuffValue value={buff.value} />
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Applies To
                </p>
                <BuffTags tags={buff.tags} />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function fmtMv(motionValue: number) {
  return fmt(motionValue / 10_000);
}

function renderMotionValue(
  motionValue: number,
  scalingAttribute: AttackTableRow['scalingAttribute'],
  motionValuePerStack?: number,
) {
  const scalingLabel = startCase(scalingAttribute);

  if (motionValuePerStack === undefined) {
    return `${fmtMv(motionValue)} ${scalingLabel}`;
  }

  return `${fmtMv(motionValue)}+${fmtMv(motionValuePerStack)} per Stack ${scalingLabel}`;
}

function sumByHits(values: Array<{ value: number; hits: number }>) {
  return values.reduce((total, { value, hits }) => total + value * hits, 0);
}

function getAlternativeMotionValue(instance: EntityAttack['instances'][number]) {
  const firstAlternativeDefinition = Object.values(
    instance.alternativeDefinitions ?? {},
  ).at(0);
  return firstAlternativeDefinition?.motionValue;
}

function getAlternativeMotionValuePerStack(
  instance: EntityAttack['instances'][number],
) {
  const firstAlternativeDefinition = Object.values(
    instance.alternativeDefinitions ?? {},
  ).at(0);
  return firstAlternativeDefinition?.motionValuePerStack;
}

type AttackTableRow = EntityAttack['instances'][number];
type DamageInstanceTableRow = DamageInstance;

function EntityDamageInstancesList({
  id,
  entityType,
}: {
  id: number;
  entityType: EntityType;
}) {
  const { data } = useEntityDamageInstances(id, entityType);

  if (data.length === 0) {
    return <p className="text-muted-foreground text-sm">No damage instances found.</p>;
  }

  const columns: Array<ColumnDef<DamageInstanceTableRow>> = [
    {
      id: 'info',
      header: '',
      cell: ({ row }) => (
        <InfoTooltip contentClassName="font-mono text-xs">
          {[row.original.id, ...row.original.dedupedIds].join(', ')}
        </InfoTooltip>
      ),
      meta: {
        headerClassName: 'w-8',
        cellClassName: 'w-8',
      },
    },
    {
      accessorKey: 'id',
      header: 'ID',
      meta: {
        headerClassName: 'min-w-20',
        cellClassName: 'min-w-20 font-mono text-xs',
      },
    },
    {
      id: 'motionValue',
      header: 'Motion Value',
      cell: ({ row }) =>
        renderMotionValue(
          row.original.motionValue,
          row.original.scalingAttribute,
          row.original.motionValuePerStack,
        ),
      meta: {
        headerClassName: 'min-w-56',
        cellClassName: 'min-w-56 font-mono text-sm',
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => startCase(row.original.type),
      meta: {
        headerClassName: 'min-w-28',
        cellClassName: 'min-w-28',
      },
    },
    {
      id: 'subtypes',
      header: 'Subtypes',
      cell: ({ row }) => <BuffTags tags={row.original.subtypes} />,
      meta: {
        headerClassName: 'min-w-40',
        cellClassName: 'min-w-40',
      },
    },
    {
      accessorKey: 'attribute',
      header: 'Attribute',
      cell: ({ row }) => startCase(row.original.attribute),
      meta: {
        headerClassName: 'min-w-24',
        cellClassName: 'min-w-24',
      },
    },
    {
      accessorKey: 'scalingAttribute',
      header: 'Scaling',
      cell: ({ row }) => startCase(row.original.scalingAttribute),
      meta: {
        headerClassName: 'min-w-24',
        cellClassName: 'min-w-24',
      },
    },
    {
      accessorKey: 'concertoRegen',
      header: 'Concerto Regen',
      meta: {
        headerClassName: 'min-w-24',
        cellClassName: 'min-w-24',
      },
    },
    {
      accessorKey: 'offTuneBuildup',
      header: 'Off-Tune Buildup',
      meta: {
        headerClassName: 'min-w-24',
        cellClassName: 'min-w-24',
      },
    },
    {
      accessorKey: 'energy',
      header: 'Energy',
      meta: {
        headerClassName: 'min-w-16',
        cellClassName: 'min-w-16',
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      classNames={{
        wrapper: 'bg-muted/30 rounded-md border',
      }}
    />
  );
}

function EntityAttacksList({ id, entityType }: { id: number; entityType: EntityType }) {
  const { data } = useEntityAttacks(id, entityType);

  if (data.length === 0) {
    return <p className="text-muted-foreground text-sm">No attacks found.</p>;
  }

  const bySkill = groupBy(data, (attack) => attack.skillId);
  const columns: Array<ColumnDef<AttackTableRow>> = [
    {
      id: 'info',
      header: '',
      cell: ({ row }) => (
        <InfoTooltip contentClassName="font-mono text-xs">
          {[row.original.id, ...row.original.dedupedIds].join(', ')}
        </InfoTooltip>
      ),
      meta: {
        headerClassName: 'w-8',
        cellClassName: 'w-8',
      },
    },
    {
      id: 'motionValue',
      header: 'Motion Value',
      cell: ({ row }) => {
        const alternativeMotionValue = getAlternativeMotionValue(row.original);
        const alternativeMotionValuePerStack = getAlternativeMotionValuePerStack(
          row.original,
        );

        return (
          <div className="font-mono text-sm">
            {renderMotionValue(
              row.original.motionValue,
              row.original.scalingAttribute,
              row.original.motionValuePerStack,
            )}
            {alternativeMotionValue !== undefined && (
              <span className="text-muted-foreground ml-1">
                (
                {renderMotionValue(
                  alternativeMotionValue,
                  row.original.scalingAttribute,
                  alternativeMotionValuePerStack,
                )}
                )
              </span>
            )}
          </div>
        );
      },
      meta: {
        headerClassName: 'min-w-56',
        cellClassName: 'min-w-56',
      },
    },
    {
      id: 'hits',
      header: 'Hits',
      cell: ({ row }) => row.original.hitCount,
      meta: {
        headerClassName: 'w-14',
        cellClassName: 'w-14',
      },
    },
    {
      id: 'type',
      header: 'Type',
      cell: ({ row }) => startCase(row.original.type),
      meta: {
        headerClassName: 'min-w-28',
        cellClassName: 'min-w-28',
      },
    },
    {
      id: 'subtypes',
      header: 'Subtypes',
      cell: ({ row }) => <BuffTags tags={row.original.subtypes} />,
      meta: {
        headerClassName: 'min-w-40',
        cellClassName: 'min-w-40',
      },
    },
    {
      id: 'attribute',
      header: 'Attribute',
      cell: ({ row }) => startCase(row.original.attribute),
      meta: {
        headerClassName: 'min-w-24',
        cellClassName: 'min-w-24',
      },
    },
    {
      accessorKey: 'concertoRegen',
      header: 'Concerto Regen',
      meta: {
        headerClassName: 'min-w-24',
        cellClassName: 'min-w-24',
      },
    },
    {
      accessorKey: 'offTuneBuildup',
      header: 'Off-Tune Buildup',
      meta: {
        headerClassName: 'min-w-24',
        cellClassName: 'min-w-24',
      },
    },
    {
      accessorKey: 'energy',
      header: 'Energy',
      meta: {
        headerClassName: 'min-w-16',
        cellClassName: 'min-w-16',
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {Object.values(bySkill).map((skillAttacks) => {
        const first = skillAttacks[0];
        return (
          <Card key={first.skillId} className="gap-0 py-0">
            <CardHeader className="py-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <span>{first.skillName}</span>
                <Badge variant="outline">{first.skillOriginType}</Badge>
              </CardTitle>
              {first.skillDescription && <Description text={first.skillDescription} />}
            </CardHeader>
            <CardContent className="flex flex-col divide-y p-0">
              {skillAttacks.map((attack) => (
                <div
                  key={`${attack.skillId}-${attack.skillAttribute?.order ?? 'none'}`}
                >
                  {attack.skillAttribute && (
                    <p className="text-muted-foreground px-4 pt-3 pb-1 text-xs font-medium tracking-wide uppercase">
                      {attack.skillAttribute.name}
                    </p>
                  )}
                  <div className="px-4 pb-4">
                    <DataTable
                      columns={columns}
                      data={attack.instances}
                      classNames={{
                        wrapper: 'bg-muted/30 rounded-md border',
                      }}
                      renderFooter={() => {
                        const summaryScalingAttribute =
                          attack.instances[0].scalingAttribute;
                        const hasAlternativeMotionValue = attack.instances.some(
                          (instance) =>
                            getAlternativeMotionValue(instance) !== undefined,
                        );
                        const totalMotionValue = sumByHits(
                          attack.instances.map((instance) => ({
                            value: instance.motionValue,
                            hits: instance.hitCount,
                          })),
                        );
                        const totalMotionValuePerStack = sumByHits(
                          attack.instances.map((instance) => ({
                            value: instance.motionValuePerStack ?? 0,
                            hits: instance.hitCount,
                          })),
                        );
                        const totalAlternativeMotionValue = sumByHits(
                          attack.instances.map((instance) => ({
                            value:
                              getAlternativeMotionValue(instance) ??
                              instance.motionValue,
                            hits: instance.hitCount,
                          })),
                        );
                        const totalAlternativeMotionValuePerStack = sumByHits(
                          attack.instances.map((instance) => ({
                            value: getAlternativeMotionValuePerStack(instance) ?? 0,
                            hits: instance.hitCount,
                          })),
                        );
                        const totalConcertoRegen = sumByHits(
                          attack.instances.map((instance) => ({
                            value: instance.concertoRegen,
                            hits: instance.hitCount,
                          })),
                        );
                        const totalOffTuneBuildup = sumByHits(
                          attack.instances.map((instance) => ({
                            value: instance.offTuneBuildup,
                            hits: instance.hitCount,
                          })),
                        );
                        const totalEnergy = sumByHits(
                          attack.instances.map((instance) => ({
                            value: instance.energy,
                            hits: instance.hitCount,
                          })),
                        );

                        return (
                          <TableRow className="font-semibold">
                            <TableCell />
                            <TableCell className="font-mono text-sm">
                              {renderMotionValue(
                                totalMotionValue,
                                summaryScalingAttribute,
                                totalMotionValuePerStack || undefined,
                              )}
                              {hasAlternativeMotionValue && (
                                <span className="text-muted-foreground ml-1">
                                  (
                                  {renderMotionValue(
                                    totalAlternativeMotionValue,
                                    summaryScalingAttribute,
                                    totalAlternativeMotionValuePerStack || undefined,
                                  )}
                                  )
                                </span>
                              )}
                            </TableCell>
                            <TableCell />
                            <TableCell />
                            <TableCell />
                            <TableCell />
                            <TableCell>{totalConcertoRegen}</TableCell>
                            <TableCell>{totalOffTuneBuildup}</TableCell>
                            <TableCell>{totalEnergy}</TableCell>
                          </TableRow>
                        );
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function EntityHeader({ id, entityType }: { id: number; entityType: string }) {
  const { data } = useGameDataEntities({});
  const entity = data.find((gameDataEntity) => gameDataEntity.id === id);

  return (
    <div>
      <h2 className="text-2xl font-bold">{entity?.name ?? `ID ${id}`}</h2>
      <p className="text-muted-foreground text-sm">
        {startCase(entityType)}
        {entity?.description ? ` · ${entity.description}` : ''}
      </p>
    </div>
  );
}

function EntityBuffsPage() {
  const { id } = Route.useParams();
  const { entityType } = Route.useSearch();
  const numericId = Number.parseInt(id);
  const navigate = useNavigate();

  return (
    <Container padding="page" className="h-full min-h-0 max-w-6xl">
      <Stack gap="component" className="h-full min-h-0">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 self-start"
          onClick={() => navigate({ to: '/game-data' })}
        >
          ← Game Data
        </Button>
        <Suspense fallback={<div className="h-10" />}>
          <EntityHeader id={numericId} entityType={entityType} />
        </Suspense>
        <Tabs defaultValue="buffs" className="min-h-0 flex-1 gap-4">
          <TabsList className="w-fit">
            <TabsTrigger value="buffs">Buffs</TabsTrigger>
            <TabsTrigger value="modifiers">Modifiers</TabsTrigger>
            <TabsTrigger value="attacks">Attacks</TabsTrigger>
            <TabsTrigger value="damage-instances">Damage Instances</TabsTrigger>
          </TabsList>
          <TabsContent value="buffs" className="min-h-0 flex-1 overflow-y-auto">
            <Suspense
              fallback={
                <Card className="h-32">
                  <LoadingSpinnerContainer
                    message="Loading buffs..."
                    spinnerSize={40}
                  />
                </Card>
              }
            >
              <EntityBuffsList id={numericId} entityType={entityType as EntityType} />
            </Suspense>
          </TabsContent>
          <TabsContent value="modifiers" className="min-h-0 flex-1 overflow-y-auto">
            <Suspense
              fallback={
                <Card className="h-32">
                  <LoadingSpinnerContainer
                    message="Loading modifiers..."
                    spinnerSize={40}
                  />
                </Card>
              }
            >
              <EntityModifiersList
                id={numericId}
                entityType={entityType as EntityType}
              />
            </Suspense>
          </TabsContent>
          <TabsContent value="attacks" className="min-h-0 flex-1 overflow-y-auto">
            <Suspense
              fallback={
                <Card className="h-32">
                  <LoadingSpinnerContainer
                    message="Loading attacks..."
                    spinnerSize={40}
                  />
                </Card>
              }
            >
              <EntityAttacksList id={numericId} entityType={entityType as EntityType} />
            </Suspense>
          </TabsContent>
          <TabsContent
            value="damage-instances"
            className="min-h-0 flex-1 overflow-y-auto"
          >
            <Suspense
              fallback={
                <Card className="h-32">
                  <LoadingSpinnerContainer
                    message="Loading damage instances..."
                    spinnerSize={40}
                  />
                </Card>
              }
            >
              <EntityDamageInstancesList
                id={numericId}
                entityType={entityType as EntityType}
              />
            </Suspense>
          </TabsContent>
        </Tabs>
      </Stack>
    </Container>
  );
}

export const Route = createFileRoute('/game-data_/$id')({
  validateSearch: z.object({
    entityType: z.string(),
  }),
  component: EntityBuffsPage,
});
