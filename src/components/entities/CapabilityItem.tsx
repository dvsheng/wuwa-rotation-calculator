import { startCase } from 'es-toolkit';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { isAttack, isModifier } from '@/services/game-data';
import type {
  Attack,
  Capability,
  Modifier,
  PermanentStat,
  Sequence,
} from '@/services/game-data';

import { EntityIcon } from '../common/EntityIcon';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../ui/hover-card';

import { CapabilityCard } from './CapabilityCard';
import { getCapabilityAnchorId } from './entityView.utilities';
import { ReportCapabilityIssueDialog } from './ReportCapabilityIssueDialog';

export const CapabilityItem = ({
  capability,
  defaultDefinition = 'base',
  showCapabilityTypeBadge = false,
  showSkillIcon = false,
}: {
  capability: Capability;
  defaultDefinition?: 'base' | Sequence;
  showCapabilityTypeBadge?: boolean;
  showSkillIcon?: boolean;
}) => {
  if (capability.capabilityJson.type === 'permanent_stat') {
    return;
  }
  return (
    <div id={getCapabilityAnchorId(capability.id)}>
      <CapabilityCard
        key={`${capability.id}-${defaultDefinition}`}
        capability={capability}
        defaultDefinition={defaultDefinition}
        titlePrefix={
          showSkillIcon && capability.iconUrl ? (
            <EntityIcon iconUrl={capability.iconUrl} size="small" />
          ) : undefined
        }
        titleSuffix={
          showCapabilityTypeBadge ? (
            <Badge variant="outline">{startCase(capability.capabilityJson.type)}</Badge>
          ) : undefined
        }
        renderCapability={(resolvedCapability) => (
          <>
            {isAttack(resolvedCapability) && (
              <AttackContent content={resolvedCapability} />
            )}
            {isModifier(resolvedCapability) && (
              <ModifierContent content={resolvedCapability} />
            )}
          </>
        )}
      />
    </div>
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
        {content.capabilityJson.damageInstances.map((instance, index) => (
          <TableRow key={index}>
            <TableCell>
              <span className="font-mono">
                {typeof instance.motionValue === 'number' ? (
                  toPercent(instance.motionValue)
                ) : (
                  <FormulaTooltip label="Dynamic" formula={instance.motionValue} />
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
        {content.capabilityJson.modifiedStats.map((stat, index) => (
          <TableRow key={index}>
            <TableCell>
              <span className="font-mono">
                {typeof stat.value === 'number' ? (
                  String(stat.value)
                ) : (
                  <FormulaTooltip label="Dynamic" formula={stat.value} />
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

export const PermanentStatContent = ({
  content,
}: {
  content: Array<PermanentStat & { isAlternativePlacement?: boolean }>;
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Permanent Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <Table className="table-fixed">
          <colgroup>
            <col style={{ width: '18%' }} />
            <col style={{ width: '36%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '6%' }} />
          </colgroup>
          <TableHeader>
            <TableHead> Name </TableHead>
            <TableHead> Description </TableHead>
            <TableHead> Buff Value</TableHead>
            <TableHead> Buffed Stat </TableHead>
            <TableHead> Applied To </TableHead>
            <TableHead className="w-0 px-1 text-right">
              <span className="sr-only">Report issue</span>
            </TableHead>
          </TableHeader>
          <TableBody>
            {content.map((stat, index) => (
              <TableRow
                key={index}
                id={getCapabilityAnchorId(stat.id)}
                data-capability-id={stat.id}
                data-capability-placement={
                  stat.isAlternativePlacement ? 'alternative' : 'direct'
                }
                className="scroll-mt-24"
              >
                <TableCell>{stat.name}</TableCell>
                <TableCell>{stat.description}</TableCell>
                <TableCell>
                  <span className="font-mono">
                    {typeof stat.capabilityJson.value === 'number' ? (
                      String(stat.capabilityJson.value)
                    ) : (
                      <FormulaTooltip
                        label="Dynamic"
                        formula={stat.capabilityJson.value}
                      />
                    )}
                  </span>
                </TableCell>
                <TableCell>{startCase(stat.capabilityJson.stat)}</TableCell>
                <TableCell>{stat.capabilityJson.tags.join(', ')}</TableCell>
                <TableCell className="px-1 text-right">
                  <ReportCapabilityIssueDialog
                    capability={stat}
                    entityId={stat.entityId}
                    iconOnly={true}
                  />
                </TableCell>
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
      <HoverCardContent className="w-fit max-w-3xl overflow-hidden p-0">
        <div className="max-h-96 max-w-3xl overflow-auto">
          <pre className="w-fit min-w-full p-4 text-xs whitespace-pre">
            {JSON.stringify(formula, undefined, 4)}
          </pre>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
