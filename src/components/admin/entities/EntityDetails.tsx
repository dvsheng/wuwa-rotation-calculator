/* eslint-disable unicorn/no-null */
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heading } from '@/components/ui/typography';
import { EntityType } from '@/db/schema';
import { deleteAttack } from '@/services/admin/attacks.function';
import { getEntityWithCapabilities } from '@/services/admin/entities.function';
import { deleteModifier } from '@/services/admin/modifiers.function';
import { deletePermanentStat } from '@/services/admin/permanent-stats.function';

import { AttackDialog } from '../attacks/AttackDialog';
import { ModifierDialog } from '../modifiers/ModifierDialog';
import { PermanentStatDialog } from '../permanent-stats/PermanentStatDialog';

interface EntityDetailsProperties {
  entityId: number;
}

export const EntityDetails = ({ entityId }: EntityDetailsProperties) => {
  const [isAttackDialogOpen, setIsAttackDialogOpen] = useState(false);
  const [isModifierDialogOpen, setIsModifierDialogOpen] = useState(false);
  const [isPermanentStatDialogOpen, setIsPermanentStatDialogOpen] = useState(false);
  const [selectedAttackId, setSelectedAttackId] = useState<number | null>(null);
  const [selectedModifierId, setSelectedModifierId] = useState<number | null>(null);
  const [selectedPermanentStatId, setSelectedPermanentStatId] = useState<number | null>(
    null,
  );

  const {
    data: entity,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'entities', entityId, 'with-capabilities'],
    queryFn: () => getEntityWithCapabilities({ data: { id: entityId } }),
  });

  if (isLoading) {
    return <div className="text-muted-foreground p-8 text-center">Loading...</div>;
  }

  if (!entity) {
    return (
      <div className="text-muted-foreground p-8 text-center">Entity not found</div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={16} className="mr-2" />
            Back to Entities
          </Button>
        </Link>
        <Heading level={1}>{entity.name}</Heading>
        <span className="text-muted-foreground text-sm capitalize">
          ({entity.type.replace('_', ' ')})
        </span>
      </div>

      {/* Entity Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Entity Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-muted-foreground text-sm">ID</div>
            <div>{entity.id}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">Hakushin ID</div>
            <div>{entity.hakushinId ?? '—'}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">Type</div>
            <div className="capitalize">{entity.type.replace('_', ' ')}</div>
          </div>
          {entity.attribute && (
            <div>
              <div className="text-muted-foreground text-sm">Attribute</div>
              <div className="capitalize">{entity.attribute}</div>
            </div>
          )}
          {entity.iconPath && (
            <div className="col-span-2">
              <div className="text-muted-foreground text-sm">Icon Path</div>
              <div className="font-mono text-sm">{entity.iconPath}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attacks Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Attacks ({entity.attacks.length})</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setSelectedAttackId(null);
              setIsAttackDialogOpen(true);
            }}
          >
            <Plus size={16} className="mr-2" />
            Add Attack
          </Button>
        </CardHeader>
        <CardContent>
          {entity.attacks.length > 0 ? (
            <Accordion type="multiple" className="w-full">
              {entity.attacks.map((attack) => (
                <AccordionItem key={attack.id} value={`attack-${attack.id}`}>
                  <div className="flex items-center gap-2">
                    <AccordionTrigger className="flex-1 hover:no-underline">
                      <div className="text-left">
                        <div className="font-medium">
                          {attack.name || attack.description || 'Unnamed Attack'}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          {attack.parentName && `${attack.parentName} • `}
                          Scaling: {attack.scalingStat.toUpperCase()} {'•'}{' '}
                          {attack.attribute}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAttackId(attack.id);
                          setIsAttackDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={async () => {
                          if (
                            globalThis.confirm(
                              `Are you sure you want to delete attack "${attack.name || attack.description || 'Unnamed Attack'}"?`,
                            )
                          ) {
                            await deleteAttack({ data: { id: attack.id } });
                            refetch();
                          }
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div>
                        <div className="text-muted-foreground text-sm">ID</div>
                        <div>{attack.id}</div>
                      </div>
                      {entity.type === EntityType.CHARACTER && (
                        <>
                          <div>
                            <div className="text-muted-foreground text-sm">Name</div>
                            <div>{attack.name ?? '—'}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-sm">
                              Parent Name
                            </div>
                            <div>{attack.parentName ?? '—'}</div>
                          </div>
                        </>
                      )}
                      <div className="col-span-2">
                        <div className="text-muted-foreground text-sm">Description</div>
                        <div>{attack.description ?? '—'}</div>
                      </div>
                      {entity.type === EntityType.CHARACTER && (
                        <>
                          <div>
                            <div className="text-muted-foreground text-sm">
                              Icon Path
                            </div>
                            <div className="font-mono text-sm">
                              {attack.iconPath ?? '—'}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-sm">
                              Unlocked At
                            </div>
                            <div>{attack.unlockedAt ?? '—'}</div>
                          </div>
                        </>
                      )}
                      {entity.type === EntityType.ECHO_SET && (
                        <div>
                          <div className="text-muted-foreground text-sm">
                            Echo Set Bonus Req
                          </div>
                          <div>{attack.echoSetBonusRequirement ?? '—'}</div>
                        </div>
                      )}
                      <div>
                        <div className="text-muted-foreground text-sm">
                          Scaling Stat
                        </div>
                        <div className="capitalize">{attack.scalingStat}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-sm">Attribute</div>
                        <div className="capitalize">{attack.attribute}</div>
                      </div>
                      {entity.type === EntityType.CHARACTER && (
                        <div>
                          <div className="text-muted-foreground text-sm">
                            Origin Type
                          </div>
                          <div>{attack.originType ?? '—'}</div>
                        </div>
                      )}
                      <div className="col-span-2">
                        <div className="text-muted-foreground text-sm">
                          Motion Values ({attack.motionValues.length})
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {attack.motionValues.map((value, index) => (
                            <div
                              key={index}
                              className="bg-muted rounded px-3 py-2 text-sm"
                            >
                              <span className="text-muted-foreground text-xs">
                                [{index}]
                              </span>{' '}
                              {typeof value === 'number' ? (
                                <span className="font-mono">{value}</span>
                              ) : (
                                <pre className="mt-1 inline-block text-xs">
                                  {JSON.stringify(value, null, 2)}
                                </pre>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-muted-foreground text-sm">Tags</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {attack.tags.length > 0 ? (
                            attack.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="bg-secondary text-secondary-foreground rounded px-2 py-1 text-xs"
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              No tags
                            </span>
                          )}
                        </div>
                      </div>
                      {attack.alternativeDefinitions && (
                        <div className="col-span-2">
                          <div className="text-muted-foreground text-sm">
                            Alternative Definitions
                          </div>
                          <pre className="bg-muted mt-1 overflow-x-auto rounded p-2 text-xs">
                            {JSON.stringify(attack.alternativeDefinitions, null, 2)}
                          </pre>
                        </div>
                      )}
                      <div>
                        <div className="text-muted-foreground text-sm">Created At</div>
                        <div className="text-sm">
                          {new Date(attack.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-sm">Updated At</div>
                        <div className="text-sm">
                          {new Date(attack.updatedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-muted-foreground text-center">No attacks defined</div>
          )}
        </CardContent>
      </Card>

      {/* Modifiers Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Modifiers ({entity.modifiers.length})</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setSelectedModifierId(null);
              setIsModifierDialogOpen(true);
            }}
          >
            <Plus size={16} className="mr-2" />
            Add Modifier
          </Button>
        </CardHeader>
        <CardContent>
          {entity.modifiers.length > 0 ? (
            <Accordion type="multiple" className="w-full">
              {entity.modifiers.map((modifier) => (
                <AccordionItem key={modifier.id} value={`modifier-${modifier.id}`}>
                  <div className="flex items-center gap-2">
                    <AccordionTrigger className="flex-1 hover:no-underline">
                      <div className="text-left">
                        <div className="font-medium">
                          {modifier.name || modifier.description || 'Unnamed Modifier'}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          {modifier.parentName && `${modifier.parentName} • `}
                          Target: {modifier.target} • {modifier.modifiedStats.length}{' '}
                          stats
                        </div>
                      </div>
                    </AccordionTrigger>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedModifierId(modifier.id);
                          setIsModifierDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={async () => {
                          if (
                            globalThis.confirm(
                              `Are you sure you want to delete modifier "${modifier.name || modifier.description || 'Unnamed Modifier'}"?`,
                            )
                          ) {
                            await deleteModifier({ data: { id: modifier.id } });
                            refetch();
                          }
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div>
                        <div className="text-muted-foreground text-sm">ID</div>
                        <div>{modifier.id}</div>
                      </div>
                      {entity.type === EntityType.CHARACTER && (
                        <>
                          <div>
                            <div className="text-muted-foreground text-sm">Name</div>
                            <div>{modifier.name ?? '—'}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-sm">
                              Parent Name
                            </div>
                            <div>{modifier.parentName ?? '—'}</div>
                          </div>
                        </>
                      )}
                      <div className="col-span-2">
                        <div className="text-muted-foreground text-sm">Description</div>
                        <div>{modifier.description ?? '—'}</div>
                      </div>
                      {entity.type === EntityType.CHARACTER && (
                        <>
                          <div>
                            <div className="text-muted-foreground text-sm">
                              Icon Path
                            </div>
                            <div className="font-mono text-sm">
                              {modifier.iconPath ?? '—'}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-sm">
                              Unlocked At
                            </div>
                            <div>{modifier.unlockedAt ?? '—'}</div>
                          </div>
                        </>
                      )}
                      {entity.type === EntityType.ECHO_SET && (
                        <div>
                          <div className="text-muted-foreground text-sm">
                            Echo Set Bonus Req
                          </div>
                          <div>{modifier.echoSetBonusRequirement ?? '—'}</div>
                        </div>
                      )}
                      <div>
                        <div className="text-muted-foreground text-sm">Target</div>
                        <div className="capitalize">{modifier.target}</div>
                      </div>
                      {entity.type === EntityType.CHARACTER && (
                        <div>
                          <div className="text-muted-foreground text-sm">
                            Origin Type
                          </div>
                          <div>{modifier.originType ?? '—'}</div>
                        </div>
                      )}
                      <div className="col-span-2">
                        <div className="text-muted-foreground text-sm">
                          Modified Stats ({modifier.modifiedStats.length})
                        </div>
                        <div className="mt-2 space-y-3">
                          {modifier.modifiedStats.map((stat, index) => (
                            <div key={index} className="bg-muted rounded p-3 text-sm">
                              <div className="text-muted-foreground mb-2 flex items-center gap-2 text-xs">
                                <span className="font-semibold">[{index}]</span>
                                <span className="bg-secondary text-secondary-foreground rounded px-2 py-0.5">
                                  {stat.stat}
                                </span>
                              </div>
                              <div className="space-y-1">
                                {Object.entries(stat).map(([key, value]) => (
                                  <div key={key} className="flex gap-2">
                                    <span className="text-muted-foreground min-w-[100px] text-xs">
                                      {key}:
                                    </span>
                                    <span className="font-mono text-xs">
                                      {typeof value === 'object'
                                        ? JSON.stringify(value)
                                        : String(value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {modifier.alternativeDefinitions && (
                        <div className="col-span-2">
                          <div className="text-muted-foreground text-sm">
                            Alternative Definitions
                          </div>
                          <pre className="bg-muted mt-1 overflow-x-auto rounded p-2 text-xs">
                            {JSON.stringify(modifier.alternativeDefinitions, null, 2)}
                          </pre>
                        </div>
                      )}
                      <div>
                        <div className="text-muted-foreground text-sm">Created At</div>
                        <div className="text-sm">
                          {new Date(modifier.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-sm">Updated At</div>
                        <div className="text-sm">
                          {new Date(modifier.updatedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-muted-foreground text-center">
              No modifiers defined
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permanent Stats Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Permanent Stats ({entity.permanentStats.length})</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setSelectedPermanentStatId(null);
              setIsPermanentStatDialogOpen(true);
            }}
          >
            <Plus size={16} className="mr-2" />
            Add Permanent Stat
          </Button>
        </CardHeader>
        <CardContent>
          {entity.permanentStats.length > 0 ? (
            <Accordion type="multiple" className="w-full">
              {entity.permanentStats.map((stat) => (
                <AccordionItem key={stat.id} value={`stat-${stat.id}`}>
                  <div className="flex items-center gap-2">
                    <AccordionTrigger className="flex-1 hover:no-underline">
                      <div className="text-left">
                        <div className="font-medium">
                          {stat.name || stat.description || 'Unnamed Stat'}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          {stat.parentName && `${stat.parentName} • `}
                          Stat: {stat.stat}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPermanentStatId(stat.id);
                          setIsPermanentStatDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={async () => {
                          if (
                            globalThis.confirm(
                              `Are you sure you want to delete permanent stat "${stat.name || stat.description || 'Unnamed Stat'}"?`,
                            )
                          ) {
                            await deletePermanentStat({ data: { id: stat.id } });
                            refetch();
                          }
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div>
                        <div className="text-muted-foreground text-sm">ID</div>
                        <div>{stat.id}</div>
                      </div>
                      {entity.type === EntityType.CHARACTER && (
                        <>
                          <div>
                            <div className="text-muted-foreground text-sm">Name</div>
                            <div>{stat.name ?? '—'}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-sm">
                              Parent Name
                            </div>
                            <div>{stat.parentName ?? '—'}</div>
                          </div>
                        </>
                      )}
                      <div className="col-span-2">
                        <div className="text-muted-foreground text-sm">Description</div>
                        <div>{stat.description ?? '—'}</div>
                      </div>
                      {entity.type === EntityType.CHARACTER && (
                        <>
                          <div>
                            <div className="text-muted-foreground text-sm">
                              Icon Path
                            </div>
                            <div className="font-mono text-sm">
                              {stat.iconPath ?? '—'}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-sm">
                              Unlocked At
                            </div>
                            <div>{stat.unlockedAt ?? '—'}</div>
                          </div>
                        </>
                      )}
                      {entity.type === EntityType.ECHO_SET && (
                        <div>
                          <div className="text-muted-foreground text-sm">
                            Echo Set Bonus Req
                          </div>
                          <div>{stat.echoSetBonusRequirement ?? '—'}</div>
                        </div>
                      )}
                      <div>
                        <div className="text-muted-foreground text-sm">Stat</div>
                        <div className="capitalize">{stat.stat}</div>
                      </div>
                      {entity.type === EntityType.CHARACTER && (
                        <div>
                          <div className="text-muted-foreground text-sm">
                            Origin Type
                          </div>
                          <div>{stat.originType ?? '—'}</div>
                        </div>
                      )}
                      <div className="col-span-2">
                        <div className="text-muted-foreground text-sm">Value</div>
                        <pre className="bg-muted mt-1 overflow-x-auto rounded p-2 text-xs">
                          {JSON.stringify(stat.value, null, 2)}
                        </pre>
                      </div>
                      <div className="col-span-2">
                        <div className="text-muted-foreground text-sm">Tags</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {stat.tags.length > 0 ? (
                            stat.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="bg-secondary text-secondary-foreground rounded px-2 py-1 text-xs"
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              No tags
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-sm">Created At</div>
                        <div className="text-sm">
                          {new Date(stat.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-sm">Updated At</div>
                        <div className="text-sm">
                          {new Date(stat.updatedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-muted-foreground text-center">
              No permanent stats defined
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AttackDialog
        isOpen={isAttackDialogOpen}
        onClose={() => setIsAttackDialogOpen(false)}
        attackId={selectedAttackId}
        entityId={entityId}
        onSuccess={() => {
          refetch();
          setIsAttackDialogOpen(false);
        }}
      />
      <ModifierDialog
        isOpen={isModifierDialogOpen}
        onClose={() => setIsModifierDialogOpen(false)}
        modifierId={selectedModifierId}
        entityId={entityId}
        onSuccess={() => {
          refetch();
          setIsModifierDialogOpen(false);
        }}
      />
      <PermanentStatDialog
        isOpen={isPermanentStatDialogOpen}
        onClose={() => setIsPermanentStatDialogOpen(false)}
        permanentStatId={selectedPermanentStatId}
        entityId={entityId}
        onSuccess={() => {
          refetch();
          setIsPermanentStatDialogOpen(false);
        }}
      />
    </div>
  );
};
