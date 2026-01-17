import { useForm } from '@tanstack/react-form';
import { Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Section } from '@/components/ui/layout';
import { Heading } from '@/components/ui/typography';
import { EnemySchema } from '@/schemas/enemy';
import { useTeamStore } from '@/store/useTeamStore';
import { Attribute } from '@/types/attribute';

export const EnemyContainer = () => {
  const enemy = useTeamStore((state) => state.enemy);
  const updateEnemy = useTeamStore((state) => state.updateEnemy);

  const form = useForm({
    defaultValues: enemy,
    validators: {
      onChange: EnemySchema,
    },
    onSubmit: ({ value }) => {
      updateEnemy((draft) => {
        Object.assign(draft, value);
      });
    },
  });

  return (
    <Section>
      <div className="flex items-center justify-between">
        <Heading>Enemy Configuration</Heading>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Enemy Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-6"
          >
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
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                  />
                  {field.state.meta.errors.length > 0 ? (
                    <p className="text-destructive text-sm">
                      {field.state.meta.errors.join(', ')}
                    </p>
                  ) : null}
                </div>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {Object.values(Attribute).map((attr) => (
                <form.Field
                  key={attr}
                  name={`resistances.${attr}`}
                  children={(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>
                        {attr.charAt(0).toUpperCase() + attr.slice(1)} Resistance (%)
                      </Label>
                      <Input
                        id={field.name}
                        type="number"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(Number(e.target.value))}
                      />
                      {field.state.meta.errors.length > 0 ? (
                        <p className="text-destructive text-sm">
                          {field.state.meta.errors.join(', ')}
                        </p>
                      ) : null}
                    </div>
                  )}
                />
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                  <Button type="submit" disabled={!canSubmit || isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Enemy Stats'}
                  </Button>
                )}
              />
            </div>
          </form>
        </CardContent>
      </Card>
    </Section>
  );
};
