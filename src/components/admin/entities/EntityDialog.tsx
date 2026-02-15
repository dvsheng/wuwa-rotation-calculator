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
import { EntityType } from '@/db/schema';
import { CreateEntitySchema, UpdateEntitySchema } from '@/schemas/admin/entities';
import {
  createEntity,
  getEntityById,
  updateEntity,
} from '@/services/admin/entities.function';
import { Attribute } from '@/types';

interface EntityDialogProperties {
  isOpen: boolean;
  onClose: () => void;
  entityId: number | null;
  onSuccess: () => void;
}

export const EntityDialog = ({
  isOpen,
  onClose,
  entityId,
  onSuccess,
}: EntityDialogProperties) => {
  const { data: entity } = useQuery({
    queryKey: ['admin', 'entities', entityId],
    queryFn: () => getEntityById({ data: { id: entityId! } }),
    enabled: entityId !== null && isOpen,
  });

  const form = useForm({
    defaultValues: entity ?? {
      name: '',
      type: EntityType.CHARACTER as typeof EntityType.CHARACTER,
      gameId: null,
      iconUrl: null,
      attribute: Attribute.AERO as typeof Attribute.AERO,
      echoSetIds: null,
      setBonusThresholds: null,
    },
    validators: {
      onSubmit: ({ value }) => {
        const schema = entityId ? UpdateEntitySchema : CreateEntitySchema;
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
      await (entityId
        ? updateEntity({ data: { ...value, id: entityId } as any })
        : createEntity({ data: value as any }));
      onSuccess();
    },
  });

  // Local state for JSON text fields - initialized from entity data
  const [echoSetIdsText, setEchoSetIdsText] = useState(() =>
    entity?.echoSetIds ? JSON.stringify(entity.echoSetIds) : '',
  );
  const [setBonusThresholdsText, setSetBonusThresholdsText] = useState(() =>
    entity?.setBonusThresholds ? JSON.stringify(entity.setBonusThresholds) : '',
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-h-[80vh] max-w-2xl overflow-y-auto"
        key={`entity-${entityId}-${isOpen ? 'open' : 'closed'}`}
      >
        <DialogHeader>
          <DialogTitle>{entityId ? 'Edit Entity' : 'Create Entity'}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          {/* Name */}
          <form.Field
            name="name"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Name *</Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-destructive text-sm">
                    {field.state.meta.errors.join(', ')}
                  </p>
                )}
              </div>
            )}
          />

          {/* Type */}
          <form.Field
            name="type"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Type *</Label>
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
                    {Object.values(EntityType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace('_', ' ').toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          />

          {/* Hakushin ID */}
          <form.Field
            name="gameId"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Hakushin ID</Label>
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

          {/* Icon Path */}
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

          {/* Conditional fields based on type */}
          <form.Subscribe
            selector={(state) => state.values.type}
            children={(type) => {
              if (type === EntityType.CHARACTER) {
                return (
                  <form.Field
                    name="attribute"
                    children={(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Attribute *</Label>
                        <Select
                          value={field.state.value ?? undefined}
                          onValueChange={(value) =>
                            field.handleChange(value as typeof field.state.value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select attribute" />
                          </SelectTrigger>
                          <SelectContent>
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
                );
              }
              if (type === EntityType.ECHO) {
                return (
                  <form.Field
                    name="echoSetIds"
                    children={(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Echo Set IDs (JSON)</Label>
                        <Input
                          id={field.name}
                          placeholder="[1, 2, 3]"
                          value={echoSetIdsText}
                          onBlur={field.handleBlur}
                          onChange={(event) => {
                            const newValue = event.target.value;
                            setEchoSetIdsText(newValue);
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
                        />
                      </div>
                    )}
                  />
                );
              }
              if (type === EntityType.ECHO_SET) {
                return (
                  <form.Field
                    name="setBonusThresholds"
                    children={(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Set Bonus Thresholds (JSON)</Label>
                        <Input
                          id={field.name}
                          placeholder="[2, 5]"
                          value={setBonusThresholdsText}
                          onBlur={field.handleBlur}
                          onChange={(event) => {
                            const newValue = event.target.value;
                            setSetBonusThresholdsText(newValue);
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
                        />
                      </div>
                    )}
                  />
                );
              }
              return null;
            }}
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
      </DialogContent>
    </Dialog>
  );
};
