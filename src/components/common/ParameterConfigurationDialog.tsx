import { useForm } from '@tanstack/react-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { ParameterInstance } from '@/schemas/rotation';
import type { Parameter } from '@/services/game-data';

interface ParameterConfigurationDialogProperties {
  title: string;
  description?: string;
  parameters?: Array<Parameter & ParameterInstance>;
  /** Attacks covered by the buff. When length > 1, per-stack configuration is offered. */
  buffedAttacks?: Array<{ name: string }>;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onOpenChange?: (isOpen: boolean) => void;
  onSaveParameters: (values: Array<Parameter & ParameterInstance>) => void;
}

const validateValue = (value: number | undefined, parameter: Parameter) => {
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) return 'Must be a valid number';
  if (numberValue < parameter.minimum)
    return `Value must be at least ${parameter.minimum}`;
  if (parameter.maximum && numberValue > parameter.maximum)
    return `Value must be at most ${parameter.maximum}`;
};

const ParameterConfigurationForm = ({
  parameters,
  buffedAttacks = [],
  onSubmit,
}: {
  parameters: Array<Parameter & ParameterInstance>;
  buffedAttacks?: Array<{ name: string }>;
  onSubmit: (values: Array<Parameter & ParameterInstance>) => void;
}) => {
  const stackCount = buffedAttacks.length;
  const canUseStackConfig = stackCount > 1;

  const form = useForm({
    defaultValues: {
      parameters: parameters.map((p) => ({
        ...p,
        // Only restore valueConfiguration if it matches the current stack count
        valueConfiguration:
          p.valueConfiguration?.length === stackCount
            ? p.valueConfiguration
            : undefined,
      })),
    },
    onSubmit: ({ value }) => {
      onSubmit(value.parameters as Array<Parameter & ParameterInstance>);
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="grid gap-6 overflow-y-auto py-4 pr-1">
        {parameters.map((parameter, index) => (
          <div key={index} className="space-y-3">
            {/* Stack configuration toggle — only shown when the buff spans multiple attacks */}
            {canUseStackConfig && (
              <form.Subscribe
                selector={(state) => state.values.parameters[index]?.valueConfiguration}
              >
                {(valueConfiguration) => (
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`stack-config-${index}`}
                      checked={(valueConfiguration?.length ?? 0) > 0}
                      onCheckedChange={(enabled) => {
                        if (enabled) {
                          const currentValue =
                            form.state.values.parameters[index]?.value;
                          form.setFieldValue(
                            `parameters[${index}].valueConfiguration`,
                            Array.from(
                              { length: stackCount },
                              () => currentValue ?? Number.NaN,
                            ),
                          );
                          form.setFieldValue(`parameters[${index}].value`, undefined);
                        } else {
                          const firstStackValue =
                            form.state.values.parameters[index]
                              ?.valueConfiguration?.[0];
                          form.setFieldValue(
                            `parameters[${index}].valueConfiguration`,
                            undefined,
                          );
                          form.setFieldValue(
                            `parameters[${index}].value`,
                            firstStackValue,
                          );
                        }
                      }}
                    />
                    <Label htmlFor={`stack-config-${index}`}>Stack Configuration</Label>
                  </div>
                )}
              </form.Subscribe>
            )}

            {/* Either per-stack inputs or a single value input */}
            <form.Subscribe
              selector={(state) =>
                (state.values.parameters[index]?.valueConfiguration?.length ?? 0) > 0
              }
            >
              {(isStackEnabled) =>
                isStackEnabled ? (
                  <div className="space-y-2">
                    {buffedAttacks.map((attack, stackIndex) => (
                      <form.Field
                        key={stackIndex}
                        name={`parameters[${index}].valueConfiguration[${stackIndex}]`}
                        validators={{
                          onChange: ({ value }) => validateValue(value, parameter),
                        }}
                      >
                        {(field) => (
                          <div className="space-y-1">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label
                                htmlFor={field.name}
                                className="text-right text-xs"
                              >
                                {attack.name}
                              </Label>
                              <div className="col-span-3">
                                <Input
                                  id={field.name}
                                  name={field.name}
                                  type="number"
                                  value={field.state.value}
                                  onBlur={field.handleBlur}
                                  onChange={(event) =>
                                    field.handleChange(event.target.valueAsNumber)
                                  }
                                  placeholder={`Min: ${parameter.minimum}`}
                                />
                                {field.state.meta.errors.length > 0 && (
                                  <div className="text-destructive mt-1 text-xs">
                                    {field.state.meta.errors[0]}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </form.Field>
                    ))}
                    <div className="text-muted-foreground pl-[25%] text-xs">
                      Minimum: {parameter.minimum}
                      {parameter.maximum ? `, Maximum: ${parameter.maximum}` : ''}
                    </div>
                  </div>
                ) : (
                  <form.Field
                    name={`parameters[${index}].value`}
                    validators={{
                      onChange: ({ value }) =>
                        validateValue(value as number | undefined, parameter),
                    }}
                  >
                    {(field) => (
                      <div className="space-y-2">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor={field.name} className="text-right">
                            {parameters.length > 1 ? `Value ${index + 1}` : 'Value'}
                          </Label>
                          <div className="col-span-3">
                            <Input
                              id={field.name}
                              name={field.name}
                              type="number"
                              value={field.state.value as number | undefined}
                              onBlur={field.handleBlur}
                              onChange={(event) =>
                                field.handleChange(event.target.valueAsNumber)
                              }
                              placeholder={`Min: ${parameter.minimum}`}
                            />
                            {field.state.meta.errors.length > 0 && (
                              <div className="text-destructive mt-1 text-xs">
                                {field.state.meta.errors[0]}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-muted-foreground ml-[25%] pl-4 text-xs">
                          Minimum: {parameter.minimum}
                          {parameter.maximum ? `, Maximum: ${parameter.maximum}` : ''}
                        </div>
                      </div>
                    )}
                  </form.Field>
                )
              }
            </form.Subscribe>
          </div>
        ))}
      </div>
      <DialogFooter>
        <Button type="submit">Save changes</Button>
      </DialogFooter>
    </form>
  );
};

export const ParameterConfigurationDialog = ({
  title,
  description,
  parameters = [],
  buffedAttacks,
  isOpen,
  setIsOpen,
  onSaveParameters,
  onOpenChange,
}: ParameterConfigurationDialogProperties) => {
  const handleSubmit = (values: Array<Parameter & ParameterInstance>) => {
    onSaveParameters(values);
    setIsOpen(false);
  };

  const handleOnOpenChange = (open: boolean) => {
    onOpenChange?.(open);
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOnOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configure {title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ParameterConfigurationForm
          key={isOpen ? 'open' : 'closed'}
          parameters={parameters}
          buffedAttacks={buffedAttacks}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
};
