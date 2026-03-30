import { useForm } from '@tanstack/react-form';

import type { CapabilityData, Skill } from '@/services/game-data';
import { CapabilityDataSchema } from '@/services/game-data';

import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Stack } from '../ui/layout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Text } from '../ui/typography';

export interface CapabilityFormValue {
  capabilityJson: CapabilityData;
  description?: string;
  name?: string;
  skillId?: number;
}

interface CapabilityFormProperties {
  mode: 'create' | 'update';
  skills?: Array<Skill>;
  initialValues?: {
    capabilityJson: unknown;
    description?: string;
    name?: string;
    skillId?: number;
  };
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (value: CapabilityFormValue) => Promise<void>;
  submitLabel: string;
}

const normalizeOptionalText = (value: string) => {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
};

const formatCapabilityJsonError = (value: string) => {
  const parsedValue = parseCapabilityJsonInput(value);

  if (parsedValue.success) {
    return;
  }

  return parsedValue.error;
};

const parseCapabilityJsonInput = (value: string) => {
  if (value.trim().length === 0) {
    return {
      success: false as const,
      error: 'Capability JSON is required.',
    };
  }

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(value);
  } catch {
    return {
      success: false as const,
      error: 'Capability JSON must be valid JSON.',
    };
  }

  const validationResult = CapabilityDataSchema.safeParse(parsedJson);

  if (!validationResult.success) {
    const firstIssue = validationResult.error.issues[0];
    const issuePath =
      firstIssue.path.length > 0 ? `${firstIssue.path.join('.')}: ` : '';

    return {
      success: false as const,
      error: `${issuePath}${firstIssue.message}`,
    };
  }

  return {
    success: true as const,
    data: validationResult.data,
  };
};

export const CapabilityForm = ({
  mode,
  skills = [],
  initialValues,
  isSubmitting,
  onCancel,
  onSubmit,
  submitLabel,
}: CapabilityFormProperties) => {
  const defaultSkillId =
    initialValues?.skillId === undefined
      ? skills[0]
        ? String(skills[0].id)
        : ''
      : String(initialValues.skillId);

  const form = useForm({
    defaultValues: {
      capabilityJson: JSON.stringify(initialValues?.capabilityJson ?? {}, undefined, 2),
      description: initialValues?.description ?? '',
      name: initialValues?.name ?? '',
      skillId: defaultSkillId,
    },
    onSubmit: async ({ value }) => {
      const parsedCapabilityJson = parseCapabilityJsonInput(value.capabilityJson);

      if (!parsedCapabilityJson.success) {
        return;
      }

      const parsedSkillId = Number.parseInt(value.skillId, 10);

      await onSubmit({
        capabilityJson: parsedCapabilityJson.data,
        description: normalizeOptionalText(value.description),
        name: normalizeOptionalText(value.name),
        skillId:
          mode === 'create' && !Number.isNaN(parsedSkillId) ? parsedSkillId : undefined,
      });
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
    >
      <Stack gap="component">
        {mode === 'create' && (
          <form.Field
            name="skillId"
            validators={{
              onChange: ({ value }) => {
                return value ? undefined : 'Select a skill.';
              },
              onSubmit: ({ value }) => {
                return value ? undefined : 'Select a skill.';
              },
            }}
            children={(field) => (
              <Stack gap="trim">
                <Label htmlFor={field.name}>Skill</Label>
                <Select value={field.state.value} onValueChange={field.handleChange}>
                  <SelectTrigger id={field.name} className="w-full">
                    <SelectValue placeholder="Select a skill" />
                  </SelectTrigger>
                  <SelectContent>
                    {skills.map((skill) => (
                      <SelectItem key={skill.id} value={String(skill.id)}>
                        {skill.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.state.meta.errors[0] && (
                  <Text variant="caption" tone="destructive">
                    {field.state.meta.errors[0]}
                  </Text>
                )}
              </Stack>
            )}
          />
        )}
        <form.Field
          name="name"
          children={(field) => (
            <Stack gap="trim">
              <Label htmlFor={field.name}>Name</Label>
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="Optional"
              />
            </Stack>
          )}
        />
        <form.Field
          name="description"
          children={(field) => (
            <Stack gap="trim">
              <Label htmlFor={field.name}>Description</Label>
              <Textarea
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="Optional"
                rows={4}
              />
            </Stack>
          )}
        />
        <form.Field
          name="capabilityJson"
          validators={{
            onChange: ({ value }) => formatCapabilityJsonError(value),
            onSubmit: ({ value }) => formatCapabilityJsonError(value),
          }}
          children={(field) => (
            <Stack gap="trim">
              <Label htmlFor={field.name}>Capability JSON</Label>
              <Textarea
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                className="min-h-80 font-mono text-xs"
                rows={18}
                aria-invalid={field.state.meta.errors.length > 0}
              />
              {field.state.meta.errors[0] && (
                <Text variant="caption" tone="destructive">
                  {field.state.meta.errors[0]}
                </Text>
              )}
            </Stack>
          )}
        />
      </Stack>
      <DialogFooter className="mt-component">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
};
