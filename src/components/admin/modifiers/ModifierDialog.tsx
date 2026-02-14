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
import { CreateModifierSchema, UpdateModifierSchema } from '@/schemas/admin/modifiers';
import type { Modifier } from '@/schemas/admin/modifiers';
import { getEntityById } from '@/services/admin/entities.function';
import {
  createModifier,
  getModifierById,
  updateModifier,
} from '@/services/admin/modifiers.function';
import { OriginType, Sequence, Target } from '@/services/game-data';

interface ModifierDialogProperties {
  isOpen: boolean;
  onClose: () => void;
  modifierId: number | null;
  entityId: number;
  onSuccess: () => void;
}

interface ModifierFormProperties {
  modifier: Modifier | null;
  entity: Awaited<ReturnType<typeof getEntityById>> | undefined;
  entityId: number;
  onSuccess: () => void;
  onClose: () => void;
}

const ModifierForm = ({
  modifier,
  entity,
  entityId,
  onSuccess,
  onClose,
}: ModifierFormProperties) => {
  // Create form with data if available, otherwise use defaults
  const form = useForm({
    defaultValues: modifier ?? {
      entityId,
      name: null,
      parentName: null,
      description: null,
      iconPath: null,
      unlockedAt: null,
      echoSetBonusRequirement: null,
      target: Target.SELF,
      modifiedStats: [],
      alternativeDefinitions: null,
      originType: null,
    },
    validators: {
      onSubmit: ({ value }) => {
        const schema = modifier?.id ? UpdateModifierSchema : CreateModifierSchema;
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
      await (modifier?.id
        ? updateModifier({ data: { ...value, id: modifier.id } as any })
        : createModifier({ data: value as any }));
      onSuccess();
    },
  });

  // Local state for JSON text fields
  const [modifiedStatsText, setModifiedStatsText] = useState(() =>
    JSON.stringify(modifier?.modifiedStats ?? [], null, 2),
  );
  const [alternativeDefinitionsText, setAlternativeDefinitionsText] = useState(() =>
    modifier?.alternativeDefinitions
      ? JSON.stringify(modifier.alternativeDefinitions, null, 2)
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
        {/* Target */}
        <form.Field
          name="target"
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Target *</Label>
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
                  {Object.values(Target).map((target) => (
                    <SelectItem key={target} value={target}>
                      {target}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        />

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
      </div>

      {/* Modified Stats (JSON) */}
      <form.Field
        name="modifiedStats"
        children={(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Modified Stats (JSON) *</Label>
            <Textarea
              id={field.name}
              value={modifiedStatsText}
              onBlur={field.handleBlur}
              onChange={(event) => {
                const newValue = event.target.value;
                setModifiedStatsText(newValue);
                try {
                  const parsed = JSON.parse(newValue);
                  field.handleChange(parsed);
                } catch {
                  // Invalid JSON, don't update form state
                }
              }}
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-muted-foreground text-xs">
              Array of modifier stat objects
            </p>
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

export const ModifierDialog = ({
  isOpen,
  onClose,
  modifierId,
  entityId,
  onSuccess,
}: ModifierDialogProperties) => {
  const { data: modifier, isLoading: isLoadingModifier } = useQuery({
    queryKey: ['admin', 'modifiers', modifierId],
    queryFn: () => getModifierById({ data: { id: modifierId! } }),
    enabled: modifierId !== null && isOpen,
  });

  const { data: entity } = useQuery({
    queryKey: ['admin', 'entities', entityId],
    queryFn: () => getEntityById({ data: { id: entityId } }),
    enabled: isOpen,
  });

  // Show loading state when editing and data isn't ready
  const isLoading = modifierId !== null && isLoadingModifier;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{modifierId ? 'Edit Modifier' : 'Create Modifier'}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading modifier data...</div>
          </div>
        ) : (
          <ModifierForm
            key={`modifier-form-${modifierId}-${modifier?.id}`}
            modifier={modifier ?? null}
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
