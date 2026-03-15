import { useForm } from '@tanstack/react-form';
import { Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Container, Stack } from '@/components/ui/layout';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
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

const formatErrors = (errors: Array<{ message?: string } | string | undefined>) =>
  errors
    .map((error) => (typeof error === 'string' ? error : error?.message))
    .filter(Boolean)
    .join(', ');

const EnemySheetForm = () => {
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
    <Card className="mx-panel">
      <CardContent>
        <Stack gap="component">
          <form.Field
            name="level"
            children={(field) => (
              <Stack gap="inset">
                <Text variant="overline" tone="muted">
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
                    {formatErrors(field.state.meta.errors)}
                  </Text>
                ) : undefined}
              </Stack>
            )}
          />
          <Stack gap="inset">
            <Text variant="overline" tone="muted">
              Attribute Resistances
            </Text>
            <Container padding="none" className="rounded-md border">
              <Table className="rounded-md border">
                <TableHeader>
                  <TableRow>
                    <TableHead>Attribute</TableHead>
                    <TableHead className="text-right">Resistance (%)</TableHead>
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
                          <TableCell className="text-right">
                            <Input
                              id={field.name}
                              type="number"
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(event) =>
                                field.handleChange(Number(event.target.value))
                              }
                              className="w-20 not-visited:text-right"
                            />
                            {field.state.meta.errors.length > 0 ? (
                              <Text as="p" variant="bodySm" tone="destructive">
                                {formatErrors(field.state.meta.errors)}
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
        </Stack>
      </CardContent>
    </Card>
  );
};

export const EnemySheet = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Shield />
          Configure Enemy
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Configure Enemy</SheetTitle>
          <SheetDescription>
            Set the enemy level and resistances to use in rotation calculations.
          </SheetDescription>
        </SheetHeader>
        <EnemySheetForm />
      </SheetContent>
    </Sheet>
  );
};
