import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, createFileRoute } from '@tanstack/react-router';
import { ArrowLeft, Database } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { sortOriginsByAttackOrder } from '@/components/rotation-builder/constants';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { DatabaseFullCapability } from '@/db/schema';
import { useIcons } from '@/hooks/useIcons';
import { DatabaseCapabilitySchema } from '@/schemas/database';
import { getAdminEntityDetails, updateAdminCapability } from '@/services/admin';
import type { AttackOriginType } from '@/services/game-data';
import { CapabilityType } from '@/services/game-data';

interface CapabilityEditorProperties {
  capability: DatabaseFullCapability;
  entityId: number;
}

function CapabilityEditor({ capability, entityId }: CapabilityEditorProperties) {
  const [name, setName] = useState(capability.capabilityName ?? '');
  const [description, setDescription] = useState(
    capability.capabilityDescription ?? '',
  );
  const [capabilityType, setCapabilityType] = useState(capability.capabilityType);
  const [jsonText, setJsonText] = useState(
    JSON.stringify(capability.capabilityJson, undefined, 2),
  );
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async () => {
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(jsonText);
      } catch {
        throw new Error('Capability JSON must be valid JSON.');
      }

      const parsedCapabilityJson = DatabaseCapabilitySchema.safeParse(parsedJson);
      if (!parsedCapabilityJson.success) {
        throw new Error(
          parsedCapabilityJson.error.issues[0]?.message ?? 'Invalid capability JSON.',
        );
      }

      if (parsedCapabilityJson.data.type !== capabilityType) {
        throw new Error('Capability type must match capabilityJson.type.');
      }

      await updateAdminCapability({
        data: {
          capabilityId: capability.capabilityId,
          capabilityType,
          capabilityJson: parsedCapabilityJson.data,
          ...(name.trim() && { name: name.trim() }),
          ...(description.trim() && { description: description.trim() }),
        },
      });
    },
    onSuccess: async () => {
      toast.success('Capability updated.');
      await queryClient.invalidateQueries({
        queryKey: ['admin-entity-details', entityId],
      });
    },
    onError: (error) => {
      toast.error('Failed to update capability.', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label>Name</Label>
          <Input value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Type</Label>
          <Select
            value={capabilityType}
            onValueChange={(value) => setCapabilityType(value as typeof capabilityType)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={CapabilityType.ATTACK}>attack</SelectItem>
              <SelectItem value={CapabilityType.MODIFIER}>modifier</SelectItem>
              <SelectItem value={CapabilityType.PERMANENT_STAT}>
                permanent_stat
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label>Description</Label>
        <Textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <div className="space-y-1">
        <Label>Capability JSON</Label>
        <Textarea
          value={jsonText}
          onChange={(event) => setJsonText(event.target.value)}
          className="min-h-56 font-mono text-xs"
        />
      </div>

      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Capability'}
        </Button>
      </div>
    </div>
  );
}

function AdminEntityDetailsPage() {
  const { id } = Route.useParams();
  const entityId = Number.parseInt(id, 10);
  const { data: entityIcons } = useIcons(
    Number.isInteger(entityId) && entityId > 0
      ? [{ id: entityId, type: 'entity' }]
      : [],
  );
  const entityIconUrl = entityIcons?.[0]?.iconUrl;

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-entity-details', entityId],
    enabled: Number.isInteger(entityId) && entityId > 0,
    queryFn: () => getAdminEntityDetails({ data: { id: entityId } }),
  });

  if (!Number.isInteger(entityId) || entityId <= 0) {
    return (
      <div className="container mx-auto max-w-5xl p-6">
        <p className="text-destructive text-sm">Invalid entity ID.</p>
      </div>
    );
  }

  if (error instanceof Error) {
    return (
      <div className="container mx-auto max-w-5xl space-y-4 p-6">
        <Link to="/admin/entities">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Entities
          </Button>
        </Link>
        <p className="text-destructive text-sm">{error.message}</p>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="container mx-auto max-w-5xl p-6">
        <p className="text-muted-foreground text-sm">Loading entity details...</p>
      </div>
    );
  }

  let entityName = `Entity ${entityId}`;
  let entityType: string | undefined;
  let entityGameId: number | undefined;

  if (data.rows.length > 0) {
    const firstRow = data.rows[0];
    entityName = firstRow.entityName;
    entityType = firstRow.entityType;
  } else if (data.entity) {
    entityName = data.entity.name;
    entityType = data.entity.type;
    entityGameId = data.entity.gameId ?? undefined;
  }

  const skillGroups = new Map<
    number,
    {
      id: number;
      name: string;
      description?: string;
      originType: string;
      capabilities: typeof data.rows;
    }
  >();

  for (const skill of data.skills) {
    skillGroups.set(skill.id, {
      id: skill.id,
      name: skill.name,
      description: skill.description ?? undefined,
      originType: skill.originType,
      capabilities: [],
    });
  }

  for (const row of data.rows) {
    const existing = skillGroups.get(row.skillId);
    if (existing) {
      existing.capabilities.push(row);
      continue;
    }

    skillGroups.set(row.skillId, {
      id: row.skillId,
      name: row.skillName,
      description: row.skillDescription ?? undefined,
      originType: row.skillOriginType,
      capabilities: [row],
    });
  }

  const skills = [...skillGroups.values()].toSorted((left, right) => {
    const originComparison = sortOriginsByAttackOrder(
      left.originType as AttackOriginType,
      right.originType as AttackOriginType,
    );
    if (originComparison !== 0) {
      return originComparison;
    }
    return left.name.localeCompare(right.name);
  });
  const defaultOpenSkillValues = skills.map((skill) => `skill-${skill.id}`);

  return (
    <div className="container mx-auto max-w-6xl space-y-4 p-6">
      <Link to="/admin/entities">
        <Button variant="outline" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Entities
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {entityIconUrl ? (
              <img
                src={entityIconUrl}
                alt={entityName}
                className="h-8 w-8 rounded-sm"
              />
            ) : (
              <Database className="h-5 w-5" />
            )}
            {entityName}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="outline">ID: {entityId}</Badge>
          {entityGameId ? (
            <Badge variant="outline">Game ID: {entityGameId}</Badge>
          ) : undefined}
          {entityType === undefined ? undefined : (
            <Badge variant="outline" className="capitalize">
              Type: {entityType.replace('_', ' ')}
            </Badge>
          )}
        </CardContent>
      </Card>

      {skills.length === 0 ? (
        <p className="text-muted-foreground text-sm">No skills/capabilities found.</p>
      ) : (
        <Accordion
          type="multiple"
          defaultValue={defaultOpenSkillValues}
          className="w-full rounded-md border px-4"
        >
          {skills.map((skill) => (
            <AccordionItem key={skill.id} value={`skill-${skill.id}`}>
              <AccordionTrigger>
                <div className="space-y-1 text-left">
                  <div className="font-medium">{skill.name}</div>
                  <div className="text-muted-foreground text-xs">
                    {skill.originType} • {skill.capabilities.length} capabilities
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {skill.description ? (
                  <p className="text-muted-foreground mb-3 text-sm">
                    {skill.description}
                  </p>
                ) : undefined}

                <Accordion
                  type="multiple"
                  defaultValue={skill.capabilities.map(
                    (capability) => `capability-${capability.capabilityId}`,
                  )}
                  className="w-full rounded-md border px-4"
                >
                  {skill.capabilities.length === 0 ? (
                    <p className="text-muted-foreground py-3 text-sm">
                      No capabilities found for this skill.
                    </p>
                  ) : (
                    skill.capabilities.map((capability) => (
                      <AccordionItem
                        key={capability.capabilityId}
                        value={`capability-${capability.capabilityId}`}
                      >
                        <AccordionTrigger>
                          <div className="flex flex-wrap items-center gap-2 text-left">
                            <span className="font-medium">
                              {capability.capabilityName}
                            </span>
                            <Badge variant="outline">{capability.capabilityType}</Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <CapabilityEditor
                            key={`${capability.capabilityId}:${JSON.stringify(capability.capabilityJson)}`}
                            capability={capability}
                            entityId={entityId}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    ))
                  )}
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}

export const Route = createFileRoute('/admin/entities/$id')({
  component: AdminEntityDetailsPage,
});
