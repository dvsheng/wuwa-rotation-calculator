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
import {
  CreatePermanentStatSchema,
  UpdatePermanentStatSchema,
} from '@/schemas/admin/permanent-stats';
import { getEntityById } from '@/services/admin/entities.function';
import {
  createPermanentStat,
  getPermanentStatById,
  updatePermanentStat,
} from '@/services/admin/permanent-stats.function';
import { OriginType, Sequence } from '@/services/game-data';
import { CharacterStat, EnemyStat } from '@/types';

interface PermanentStatDialogProperties {
  isOpen: boolean;
  onClose: () => void;
  permanentStatId: number | null;
  entityId: number;
  onSuccess: () => void;
}

interface PermanentStatFormProperties {
  permanentStat: Awaited<ReturnType<typeof getPermanentStatById>> | null;
  entity: Awaited<ReturnType<typeof getEntityById>> | undefined;
  entityId: number;
  onSuccess: () => void;
  onClose: () => void;
}

const PermanentStatForm = ({
  permanentStat,
  entity,
  entityId,
  onSuccess,
  onClose,
}: PermanentStatFormProperties) => {
  const form = useForm({
    defaultValues: permanentStat ?? {
      entityId,
      name: null,
      parentName: null,
      description: null,
      iconUrl: null,
      unlockedAt: null,
      echoSetBonusRequirement: null,
      stat: CharacterStat.ATTACK_FLAT,
      value: 0,
      tags: [],
      originType: null,
    },
    validators: {
      onSubmit: ({ value }) => {
        const schema = permanentStat?.id
          ? UpdatePermanentStatSchema
          : CreatePermanentStatSchema;
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
      await (permanentStat?.id
        ? updatePermanentStat({ data: { ...value, id: permanentStat.id } as any })
        : createPermanentStat({ data: value as any }));
      onSuccess();
    },
  });

  // Local state for JSON text fields
  const [valueText, setValueText] = useState(() =>
    JSON.stringify(permanentStat?.value ?? 0, null, 2),
  );
  const [tagsText, setTagsText] = useState(() =>
    JSON.stringify(permanentStat?.tags ?? [], null, 2),
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
          name="iconUrl"
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
        {/* Stat */}
        <form.Field
          name="stat"
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Stat *</Label>
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
                  <optgroup label="Character Stats">
                    {Object.values(CharacterStat).map((stat) => (
                      <SelectItem key={stat} value={stat}>
                        {stat}
                      </SelectItem>
                    ))}
                  </optgroup>
                  <optgroup label="Enemy Stats">
                    {Object.values(EnemyStat).map((stat) => (
                      <SelectItem key={stat} value={stat}>
                        {stat}
                      </SelectItem>
                    ))}
                  </optgroup>
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

      {/* Value (JSON) */}
      <form.Field
        name="value"
        children={(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Value (JSON) *</Label>
            <Textarea
              id={field.name}
              value={valueText}
              onBlur={field.handleBlur}
              onChange={(event) => {
                const newValue = event.target.value;
                setValueText(newValue);
                try {
                  const parsed = JSON.parse(newValue);
                  field.handleChange(parsed);
                } catch {
                  // Invalid JSON, don't update form state
                }
              }}
              rows={4}
              className="font-mono text-sm"
            />
            <p className="text-muted-foreground text-xs">
              Number or resolvable number object
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

export const PermanentStatDialog = ({
  isOpen,
  onClose,
  permanentStatId,
  entityId,
  onSuccess,
}: PermanentStatDialogProperties) => {
  const { data: permanentStat, isLoading: isLoadingPermanentStat } = useQuery({
    queryKey: ['admin', 'permanent-stats', permanentStatId],
    queryFn: () => getPermanentStatById({ data: { id: permanentStatId! } }),
    enabled: permanentStatId !== null && isOpen,
  });

  const { data: entity } = useQuery({
    queryKey: ['admin', 'entities', entityId],
    queryFn: () => getEntityById({ data: { id: entityId } }),
    enabled: isOpen,
  });

  // Show loading state when editing and data isn't ready
  const isLoading = permanentStatId !== null && isLoadingPermanentStat;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {permanentStatId ? 'Edit Permanent Stat' : 'Create Permanent Stat'}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading permanent stat data...</div>
          </div>
        ) : (
          <PermanentStatForm
            key={`permanent-stat-form-${permanentStatId}-${permanentStat?.id}`}
            permanentStat={permanentStat ?? null}
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
