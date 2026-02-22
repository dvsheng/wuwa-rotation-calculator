import { useQuery } from '@tanstack/react-query';
import { Link, createFileRoute } from '@tanstack/react-router';
import { ArrowLeft, Database } from 'lucide-react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIcons } from '@/hooks/useIcons';
import { getAdminEntityDetails } from '@/services/admin';

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

  const skills = [...skillGroups.values()];
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
                  {skill.capabilities.map((capability) => (
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
                        {capability.capabilityDescription ? (
                          <p className="text-muted-foreground mb-3 text-sm">
                            {capability.capabilityDescription}
                          </p>
                        ) : undefined}
                        <pre className="bg-muted overflow-x-auto rounded-md p-3 text-xs">
                          {JSON.stringify(capability.capabilityJson, undefined, 2)}
                        </pre>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
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
