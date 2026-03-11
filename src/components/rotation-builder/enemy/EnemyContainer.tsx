import { useForm } from '@tanstack/react-form';

import { Input } from '@/components/ui/input';
import { Container, Stack } from '@/components/ui/layout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Text } from '@/components/ui/typography';
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
    <Stack gap="panel" className="w-96">
      <form.Field
        name="level"
        children={(field) => (
          <Stack gap="compact">
            <Text variant="overline" tone="muted" as="label" htmlFor={field.name}>
              Level
            </Text>
            <Input
              id={field.name}
              type="number"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(Number(event.target.value))}
            />
            {field.state.meta.errors.length > 0 ? (
              <Text as="p" variant="bodySm" tone="destructive">
                {field.state.meta.errors.join(', ')}
              </Text>
            ) : undefined}
          </Stack>
        )}
      />
      <Text variant="overline" tone="muted">
        Attribute Resistances
      </Text>
      <Container padding="none" className="rounded-md border">
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
                        <Text as="p" variant="bodySm" tone="destructive">
                          {field.state.meta.errors.join(', ')}
                        </Text>
                      ) : undefined}
                    </TableCell>
                  </TableRow>
                )}
              />
            ))}
          </TableBody>
        </Table>
      </Container>
    </Stack>
  );
};
