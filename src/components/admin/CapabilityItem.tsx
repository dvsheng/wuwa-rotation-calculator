import { startCase } from 'es-toolkit';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { DetailedAdminEntity } from '@/hooks/useAdminEntities';
import type { Sequence } from '@/services/game-data';

import { EntityIcon } from '../common/EntityIcon';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../ui/hover-card';
import { ScrollArea } from '../ui/scroll-area';

import { CapabilityCard } from './CapabilityCard';

type Entity = DetailedAdminEntity['entity'];

export type Skill = Entity['skills'][number];

export type Capability = Skill['capabilities'][number];

type CapabilityJson = Capability['capabilityJson'];

type Attack = Extract<CapabilityJson, { type: 'attack' }>;

type Modifier = Extract<CapabilityJson, { type: 'modifier' }>;

export type PermanentStatArray = Array<
  Extract<CapabilityJson, { type: 'permanent_stat' }> & {
    name: string;
    description?: string;
  }
>;

export const CapabilityItem = ({
  capability,
  skill,
  defaultAlternativeDefinition = 'base',
  showCapabilityTypeBadge = false,
  showSkillIcon = false,
}: {
  capability: Capability;
  skill: Skill;
  defaultAlternativeDefinition?: 'base' | Sequence;
  showCapabilityTypeBadge?: boolean;
  showSkillIcon?: boolean;
}) => {
  if (capability.capabilityJson.type === 'permanent_stat') {
    return;
  }

  return (
    <CapabilityCard
      key={`${capability.id}-${defaultAlternativeDefinition}`}
      capability={capability}
      defaultAlternativeDefinition={defaultAlternativeDefinition}
      titlePrefix={
        showSkillIcon && skill.iconUrl ? (
          <EntityIcon iconUrl={skill.iconUrl} size="small" />
        ) : undefined
      }
      titleSuffix={
        showCapabilityTypeBadge ? (
          <Badge variant="outline">
            {startCase(capability.capabilityJson.type.replaceAll('_', ' '))}
          </Badge>
        ) : undefined
      }
    >
      {(resolvedCapability) => (
        <>
          {resolvedCapability.capabilityJson.type === 'attack' && (
            <AttackContent content={resolvedCapability.capabilityJson} />
          )}
          {resolvedCapability.capabilityJson.type === 'modifier' && (
            <ModifierContent content={resolvedCapability.capabilityJson} />
          )}
        </>
      )}
    </CapabilityCard>
  );
};

const AttackContent = ({ content }: { content: Attack }) => {
  return (
    <Table className="w-full table-fixed">
      <TableHeader>
        <TableHead className="w-1/4"> Motion Value </TableHead>
        <TableHead className="w-1/4"> Attribute </TableHead>
        <TableHead className="w-1/4"> Damage Type </TableHead>
        <TableHead className="w-1/4"> Tags </TableHead>
      </TableHeader>
      <TableBody>
        {content.damageInstances.map((instance, index) => (
          <TableRow key={index}>
            <TableCell>
              <span className="font-mono">
                {typeof instance.motionValue === 'number' ? (
                  toPercent(instance.motionValue)
                ) : (
                  <FormulaTooltip label="Complex" formula={instance.motionValue} />
                )}
              </span>
            </TableCell>
            <TableCell>{startCase(instance.attribute)}</TableCell>
            <TableCell>{startCase(instance.damageType)}</TableCell>
            <TableCell>{instance.tags.join(', ')}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const ModifierContent = ({ content }: { content: Modifier }) => {
  return (
    <Table className="w-full table-fixed">
      <TableHeader>
        <TableHead className="w-1/4"> Buff Value</TableHead>
        <TableHead className="w-1/4"> Buffed Stat </TableHead>
        <TableHead className="w-1/4"> Target </TableHead>
        <TableHead className="w-1/4"> Applied To </TableHead>
      </TableHeader>
      <TableBody>
        {content.modifiedStats.map((stat, index) => (
          <TableRow key={index}>
            <TableCell>
              <span className="font-mono">
                {typeof stat.value === 'number' ? (
                  String(stat.value)
                ) : (
                  <FormulaTooltip label="Complex" formula={stat.value} />
                )}
              </span>
            </TableCell>
            <TableCell>{startCase(stat.stat)}</TableCell>
            <TableCell>{startCase(stat.target)}</TableCell>
            <TableCell>{stat.tags.join(', ')}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export const PermanentStatContent = ({ content }: { content: PermanentStatArray }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Permanent Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <Table className="table-fixed">
          <colgroup>
            <col style={{ width: '18%' }} />
            <col style={{ width: '34%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '17%' }} />
            <col style={{ width: '17%' }} />
          </colgroup>
          <TableHeader>
            <TableHead> Name </TableHead>
            <TableHead> Description </TableHead>
            <TableHead> Buff Value</TableHead>
            <TableHead> Buffed Stat </TableHead>
            <TableHead> Applied To </TableHead>
          </TableHeader>
          <TableBody>
            {content.map((stat, index) => (
              <TableRow key={index}>
                <TableCell>{stat.name}</TableCell>
                <TableCell>{stat.description}</TableCell>
                <TableCell>
                  <span className="font-mono">
                    {typeof stat.value === 'number' ? (
                      String(stat.value)
                    ) : (
                      <FormulaTooltip label="Complex" formula={stat.value} />
                    )}
                  </span>
                </TableCell>
                <TableCell>{startCase(stat.stat)}</TableCell>
                <TableCell>{stat.tags.join(', ')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

const toPercent = (number: number) => {
  return `${(number * 100).toFixed(2)}%`;
};

const FormulaTooltip = ({ label, formula }: { label: string; formula: object }) => {
  return (
    <HoverCard openDelay={150} closeDelay={100}>
      <HoverCardTrigger>{label}</HoverCardTrigger>
      <HoverCardContent className="w-xl p-0">
        <ScrollArea style={{ height: '24rem' }} className="w-full">
          <pre className="p-4 text-xs whitespace-pre">
            {JSON.stringify(formula, undefined, 4)}
          </pre>
        </ScrollArea>
      </HoverCardContent>
    </HoverCard>
  );
};
