import { useForm } from '@tanstack/react-form';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { DetailedAttackInstance } from '@/hooks/useTeamAttackInstances';
import type { DetailedModifierInstance } from '@/hooks/useTeamModifierInstances';
import { CapabilityType } from '@/services/game-data';
import type { Parameter } from '@/services/game-data/get-team-capabilities';
import { useStore } from '@/store';

import { Row, Stack } from '../ui/layout';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Text } from '../ui/typography';

interface ParameterConfigurationFormProperties {
  capability: DetailedAttackInstance | DetailedModifierInstance;
  buffedAttacks?: Array<DetailedAttackInstance>;
  onSave: () => void;
}

interface ParameterConfigurationDialogProperties {
  capability: DetailedAttackInstance | DetailedModifierInstance;
  buffedAttacks?: Array<DetailedAttackInstance>;
  onOpenChange?: (isOpen: boolean) => void;
  children: ReactNode;
  disabled?: boolean;
  open?: boolean;
}

const validateValue = (value: number | undefined, parameter: Parameter) => {
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) return 'Must be a valid number';
  if (numberValue < parameter.minimum)
    return `Value must be at least ${parameter.minimum}`;
  if (parameter.maximum && numberValue > parameter.maximum)
    return `Value must be at most ${parameter.maximum}`;
};

const ParameterInputHint = ({
  parameter,
  error,
}: {
  parameter: Parameter;
  error?: string;
  small?: boolean;
}) => {
  const textClassName = 'pr-trim text-right text-[10px]';
  if (error)
    return (
      <Text variant="caption" tone="destructive" className={textClassName}>
        {error}
      </Text>
    );
  return (
    <Text variant="caption" tone="muted" className={textClassName}>
      Min: {parameter.minimum}
      {parameter.maximum ? `, Max: ${parameter.maximum}` : ''}
    </Text>
  );
};

const ParameterEditorRow = ({
  name,
  fieldName,
  value,
  onChange,
  error,
  parameter,
}: {
  name: string;
  fieldName: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  error?: string;
  parameter: Parameter;
}) => (
  <Stack gap="trim" className="px-component">
    <Row justify="between">
      <Label htmlFor={fieldName} className="text-xs">
        {name}
      </Label>
      <Input
        id={name}
        type="number"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.valueAsNumber)}
        className="w-20"
      />
    </Row>
    <ParameterInputHint parameter={parameter} error={error} />
  </Stack>
);

const ParameterConfigurationForm = ({
  capability,
  buffedAttacks = [],
  onSave,
}: ParameterConfigurationFormProperties) => {
  const { parameters = [] } = capability;
  const stackCount = buffedAttacks.length;
  const canToggleView = stackCount > 1;

  const [isPerAttack, setIsPerAttack] = useState(canToggleView);
  const updateBuffParameters = useStore((state) => state.updateBuffParameters);
  const updateAttackParameters = useStore((state) => state.updateAttackParameters);
  const form = useForm({
    defaultValues: {
      parameters: parameters.map((p) => {
        if (!canToggleView) return p;
        const config =
          Array.isArray(p.valueConfiguration) && p.valueConfiguration.length > 0
            ? p.valueConfiguration
            : Array.from({ length: stackCount }, () => p.value ?? p.minimum);
        return { ...p, valueConfiguration: config };
      }),
    },
    onSubmit: ({ value }) => {
      if (isPerAttack) {
        onSubmit(
          value.parameters.map((parameter) => ({
            ...parameter,
            value: undefined,
            // Tanstack form stores array fields as objects with numeric keys at
            // runtime; cast to unknown to bypass TypeScript's type narrowing
            valueConfiguration: (() => {
              const raw = parameter.valueConfiguration as unknown;
              if (Array.isArray(raw)) return raw;
              if (raw)
                return Object.entries(raw as Record<number, number>)
                  .toSorted(([a], [b]) => Number(a) - Number(b))
                  .map(([, v]) => v);
              return;
            })(),
          })),
        );
        return;
      }
      onSubmit(
        value.parameters.map((parameter) => ({
          ...parameter,
          valueConfiguration: undefined,
        })),
      );
    },
  });

  const onSubmit = (parameters_: Array<Parameter>) => {
    const updateParameters =
      capability.capabilityJson.type === CapabilityType.ATTACK
        ? updateAttackParameters
        : updateBuffParameters;
    updateParameters(capability.instanceId, parameters_);
    onSave();
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
      className="flex min-h-0 flex-1 flex-col"
    >
      <Stack className="gap-panel min-h-0 flex-1">
        {canToggleView && (
          <Row gap="component" justify="between">
            <Label className="font-medium">Configuration mode</Label>
            <ToggleGroup
              type="single"
              value={isPerAttack ? 'per-attack' : 'single'}
              onValueChange={(value) => {
                if (!value) return;
                setIsPerAttack(value === 'per-attack');
              }}
              size="sm"
              variant="outline"
            >
              <ToggleGroupItem value="single">Single value</ToggleGroupItem>
              <ToggleGroupItem value="per-attack">Per-attack stacks</ToggleGroupItem>
            </ToggleGroup>
          </Row>
        )}
        <Separator />
        <ScrollArea className="min-h-0 flex-1">
          {parameters.map((parameter, index) => (
            <div key={index}>
              {isPerAttack ? (
                <Stack gap="inset">
                  {buffedAttacks.map((attack, stackIndex) => (
                    <form.Field
                      key={stackIndex}
                      name={`parameters[${index}].valueConfiguration[${stackIndex}]`}
                      validators={{
                        onChange: ({ value }) => validateValue(value, parameter),
                      }}
                    >
                      {(field) => (
                        <ParameterEditorRow
                          name={attack.name}
                          fieldName={field.name}
                          value={field.state.value}
                          onChange={field.handleChange}
                          error={field.state.meta.errors[0]}
                          parameter={parameter}
                        />
                      )}
                    </form.Field>
                  ))}
                </Stack>
              ) : (
                <form.Field
                  name={`parameters[${index}].value`}
                  validators={{
                    onChange: ({ value }) => validateValue(value as number, parameter),
                  }}
                >
                  {(field) => (
                    <ParameterEditorRow
                      name={parameters.length > 1 ? `Value ${index + 1}` : 'Value'}
                      fieldName={field.name}
                      value={field.state.value}
                      onChange={field.handleChange}
                      error={field.state.meta.errors[0]}
                      parameter={parameter}
                    />
                  )}
                </form.Field>
              )}
            </div>
          ))}
        </ScrollArea>
      </Stack>
      <SheetFooter>
        <Button type="submit">Save changes</Button>
      </SheetFooter>
    </form>
  );
};

export const ParameterConfigurationDialog = (
  properties: ParameterConfigurationDialogProperties,
) => {
  const { children, disabled, onOpenChange, open, ...rest } = properties;

  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = typeof open === 'boolean';
  const isOpen = isControlled ? open : internalIsOpen;

  const closeDialog = () => {
    onOpenChange?.(false);
    if (!isControlled) {
      setInternalIsOpen(false);
    }
  };

  const handleSave = () => {
    closeDialog();
  };
  const handleOpenChange = (isOpen_: boolean) => {
    if (disabled) return;
    onOpenChange?.(isOpen_);
    if (!isControlled) {
      setInternalIsOpen(isOpen_);
    }
  };

  const description = rest.capability.description;
  const title = rest.capability.name;
  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="p-panel h-full">
        <SheetHeader className="px-0 pt-0">
          <SheetTitle>Configure {title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <ParameterConfigurationForm {...rest} onSave={handleSave} />
      </SheetContent>
    </Sheet>
  );
};
