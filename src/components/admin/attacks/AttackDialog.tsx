/* eslint-disable unicorn/no-null */
import { useForm } from '@tanstack/react-form';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { EntityType } from '@/db/schema';
import { CreateAttackSchema, UpdateAttackSchema } from '@/schemas/admin/attacks';
import {
  createAttack,
  getAttackById,
  updateAttack,
} from '@/services/admin/attacks.function';
import { getEntityById } from '@/services/admin/entities.function';
import { OriginType, Sequence } from '@/services/game-data';
import { AbilityAttribute, Attribute } from '@/types';

interface AttackDialogProperties {
  isOpen: boolean;
  onClose: () => void;
  attackId: number | null;
  entityId: number;
  onSuccess: () => void;
}

interface AttackFormProperties {
  attack: Awaited<ReturnType<typeof getAttackById>> | null;
  entity: Awaited<ReturnType<typeof getEntityById>> | undefined;
  entityId: number;
  onSuccess: () => void;
  onClose: () => void;
}

const AttackForm = ({
  attack,
  entity,
  entityId,
  onSuccess,
  onClose,
}: AttackFormProperties) => {
  const form = useForm({
    defaultValues: attack ?? {
      entityId,
      name: null,
      parentName: null,
      description: null,
      iconPath: null,
      unlockedAt: null,
      echoSetBonusRequirement: null,
      scalingStat: AbilityAttribute.ATK,
      attribute: null,
      motionValues: [],
      tags: [],
      alternativeDefinitions: null,
      originType: null,
    },
    validators: {
      onSubmit: ({ value }) => {
        const schema = attack?.id ? UpdateAttackSchema : CreateAttackSchema;
        const result = schema.safeParse(value);
        if (!result.success) {
          const flattened = result.error.flatten();
          return {
            fields: flattened.fieldErrors,
            form: flattened.formErrors[0],
          };
        }
      },
    },
    onSubmit: async ({ value }) => {
      await (attack?.id
        ? updateAttack({ data: { ...value, id: attack.id } as any })
        : createAttack({ data: value as any }));
      onSuccess();
    },
  });

  // Local state for JSON text fields
  const [motionValuesText, setMotionValuesText] = useState(() =>
    JSON.stringify(attack?.motionValues ?? [], null, 2),
  );
  const [tagsText, setTagsText] = useState(() =>
    JSON.stringify(attack?.tags ?? [], null, 2),
  );
  const [alternativeDefinitionsText, setAlternativeDefinitionsText] = useState(() =>
    attack?.alternativeDefinitions
      ? JSON.stringify(attack.alternativeDefinitions, null, 2)
      : '',
  );

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      {/* Name - Only for CHARACTER entities */}
      {entity?.type === EntityType.CHARACTER && (
        <form.Field
          name="name"
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Name</Label>
              <Input
                id={field.name}
                value={field.state.value ?? ''}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value || null)}
              />
            </div>
          )}
        />
      )}

      {/* Parent Name - Only for CHARACTER entities */}
      {entity?.type === EntityType.CHARACTER && (
        <form.Field
          name="parentName"
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Parent Name</Label>
              <Input
                id={field.name}
                value={field.state.value ?? ''}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value || null)}
              />
            </div>
          )}
        />
      )}

      {/* Description */}
      <form.Field
        name="description"
        children={(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Description</Label>
            <Textarea
              id={field.name}
              value={field.state.value ?? ''}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value || null)}
              rows={3}
            />
          </div>
        )}
      />

      {/* Icon Path - Only for CHARACTER entities */}
      {entity?.type === EntityType.CHARACTER && (
        <form.Field
          name="iconPath"
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Icon Path</Label>
              <Input
                id={field.name}
                value={field.state.value ?? ''}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value || null)}
              />
            </div>
          )}
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Unlocked At - Only for CHARACTER entities */}
        {entity?.type === EntityType.CHARACTER && (
          <form.Field
            name="unlockedAt"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Unlocked At</Label>
                <Select
                  value={field.state.value ?? undefined}
                  onValueChange={(value) =>
                    field.handleChange(value as typeof field.state.value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sequence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {Object.values(Sequence).map((seq) => (
                      <SelectItem key={seq} value={seq}>
                        {seq.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          />
        )}

        {/* Echo Set Bonus Requirement - Only for ECHO_SET entities */}
        {entity?.type === EntityType.ECHO_SET && (
          <form.Field
            name="echoSetBonusRequirement"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Echo Set Bonus Req *</Label>
                <Input
                  id={field.name}
                  type="number"
                  value={field.state.value ?? ''}
                  onBlur={field.handleBlur}
                  onChange={(event) =>
                    field.handleChange(
                      event.target.value ? Number(event.target.value) : null,
                    )
                  }
                />
              </div>
            )}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Scaling Stat */}
        <form.Field
          name="scalingStat"
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Scaling Stat *</Label>
              <Select
                value={field.state.value}
                onValueChange={(value) =>
                  field.handleChange(value as typeof field.state.value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(AbilityAttribute).map((attribute) => (
                    <SelectItem key={attribute} value={attribute}>
                      {attribute.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        />

        {/* Attribute */}
        <form.Field
          name="attribute"
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Attribute</Label>
              <Select
                value={field.state.value}
                onValueChange={(value) =>
                  field.handleChange(value as typeof field.state.value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select attribute" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {Object.values(Attribute).map((attribute) => (
                    <SelectItem key={attribute} value={attribute}>
                      {attribute.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        />
      </div>

      {/* Origin Type - Only for CHARACTER entities */}
      {entity?.type === EntityType.CHARACTER && (
        <form.Field
          name="originType"
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Origin Type</Label>
              <Select
                value={field.state.value ?? undefined}
                onValueChange={(value) =>
                  field.handleChange(value as typeof field.state.value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select origin type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {Object.values(OriginType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        />
      )}

      {/* Motion Values (JSON) */}
      <form.Field
        name="motionValues"
        children={(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Motion Values (JSON) *</Label>
            <Textarea
              id={field.name}
              value={motionValuesText}
              onBlur={field.handleBlur}
              onChange={(event) => {
                const newValue = event.target.value;
                setMotionValuesText(newValue);
                try {
                  const parsed = JSON.parse(newValue);
                  field.handleChange(parsed);
                } catch {
                  // Invalid JSON, don't update form state
                }
              }}
              rows={6}
              className="font-mono text-sm"
            />
            <p className="text-muted-foreground text-xs">
              Array of numbers or parameterized number objects
            </p>
          </div>
        )}
      />

      {/* Tags (JSON) */}
      <form.Field
        name="tags"
        children={(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Tags (JSON) *</Label>
            <Textarea
              id={field.name}
              value={tagsText}
              onBlur={field.handleBlur}
              onChange={(event) => {
                const newValue = event.target.value;
                setTagsText(newValue);
                try {
                  const parsed = JSON.parse(newValue);
                  field.handleChange(parsed);
                } catch {
                  // Invalid JSON, don't update form state
                }
              }}
              rows={3}
              className="font-mono text-sm"
            />
            <p className="text-muted-foreground text-xs">Array of strings</p>
          </div>
        )}
      />

      {/* Alternative Definitions (JSON) - Only for CHARACTER entities */}
      {entity?.type === EntityType.CHARACTER && (
        <form.Field
          name="alternativeDefinitions"
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Alternative Definitions (JSON)</Label>
              <Textarea
                id={field.name}
                value={alternativeDefinitionsText}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  const newValue = event.target.value;
                  setAlternativeDefinitionsText(newValue);
                  if (!newValue) {
                    field.handleChange(null);
                    return;
                  }
                  try {
                    const parsed = JSON.parse(newValue);
                    field.handleChange(parsed);
                  } catch {
                    // Invalid JSON, don't update form state
                  }
                }}
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-muted-foreground text-xs">
                Object with sequence keys (s1-s6)
              </p>
            </div>
          )}
        />
      )}

      {/* Submit buttons */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          )}
        />
      </div>
    </form>
  );
};

export const AttackDialog = ({
  isOpen,
  onClose,
  attackId,
  entityId,
  onSuccess,
}: AttackDialogProperties) => {
  const { data: attack, isLoading: isLoadingAttack } = useQuery({
    queryKey: ['admin', 'attacks', attackId],
    queryFn: () => getAttackById({ data: { id: attackId! } }),
    enabled: attackId !== null && isOpen,
  });

  const { data: entity } = useQuery({
    queryKey: ['admin', 'entities', entityId],
    queryFn: () => getEntityById({ data: { id: entityId } }),
    enabled: isOpen,
  });

  // Show loading state when editing and data isn't ready
  const isLoading = attackId !== null && isLoadingAttack;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{attackId ? 'Edit Attack' : 'Create Attack'}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading attack data...</div>
          </div>
        ) : (
          <AttackForm
            key={`attack-form-${attackId}-${attack?.id}`}
            attack={attack ?? null}
            entity={entity}
            entityId={entityId}
            onSuccess={onSuccess}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
