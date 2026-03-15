import { Link, createFileRoute } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Stack } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';

const LandingPage = () => {
  return (
    <div className="from-background via-background to-accent/40 flex h-full min-h-0 flex-1 overflow-auto bg-linear-to-br">
      <div className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center px-6 py-12">
        <Stack gap="panel" align="center" className="text-center">
          <Stack gap="component" align="center" className="max-w-2xl">
            <Text as="h1" variant="display" className="text-5xl leading-tight">
              Wuthering Waves Theorycrafting Helper
            </Text>
            <Text variant="body" tone="muted" className="text-lg leading-8">
              Tooling to help you calculate teams and rotations in Wuthering Waves
            </Text>
          </Stack>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/create">
                Open Builder
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/builds">Browse Builds</Link>
            </Button>
          </div>
        </Stack>
      </div>
    </div>
  );
};

export const Route = createFileRoute('/')({
  component: LandingPage,
});
