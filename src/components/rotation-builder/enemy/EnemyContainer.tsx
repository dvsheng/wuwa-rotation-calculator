import { useForm } from '@tanstack/react-form';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Stack } from '@/components/ui/layout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EnemySchema } from '@/schemas/enemy';
import { useStore } from '@/store';
import { Attribute } from '@/types';

export const EnemyContainer = () => {
  const enemy = useStore((state) => state.enemy);
  const updateEnemy = useStore((state) => state.updateEnemy);

  const form = useForm({
    defaultValues: enemy,
    validators: {
      onChange: EnemySchema,
    },
    listeners: {
      onChange: ({ formApi }) => {
        if (formApi.state.isValid) {
          updateEnemy((draft) => {
            Object.assign(draft, formApi.state.values);
          });
        }
      },
    },
  });

  return (
    <div>
      <Stack>
        <form.Field
          name="level"
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Level</Label>
              <Input
                id={field.name}
                type="number"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(Number(event.target.value))}
              />
              {field.state.meta.errors.length > 0 ? (
                <p className="text-destructive text-sm">
                  {field.state.meta.errors.join(', ')}
                </p>
              ) : undefined}
            </div>
          )}
        />

        <div className="space-y-2">
          <Label>Attribute Resistances</Label>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Attribute</TableHead>
                  <TableHead className="w-36 text-right">Resistance (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.values(Attribute).map((attribute) => (
                  <form.Field
                    key={attribute}
                    name={`resistances.${attribute}`}
                    children={(field) => (
                      <TableRow>
                        <TableCell className="capitalize">{attribute}</TableCell>
                        <TableCell className="space-y-1 text-right">
                          <Input
                            id={field.name}
                            type="number"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(event) =>
                              field.handleChange(Number(event.target.value))
                            }
                            className="ml-auto w-24 text-right"
                          />
                          {field.state.meta.errors.length > 0 ? (
                            <p className="text-destructive text-xs">
                              {field.state.meta.errors.join(', ')}
                            </p>
                          ) : undefined}
                        </TableCell>
                      </TableRow>
                    )}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </Stack>
    </div>
  );
};
