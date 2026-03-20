import { Link, createFileRoute } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Stack } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';

const LandingPage = () => {
  return (
    <div className="from-background via-primary/5 to-primary/35 flex h-full min-h-0 flex-1 overflow-auto bg-linear-to-br">
      <div className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center px-6 py-12">
        <Stack gap="panel" align="center" className="text-center">
          <Stack gap="component" align="center" className="max-w-2xl">
            <Text
              as="h1"
              variant="display"
              className="max-w-full text-5xl leading-tight text-balance wrap-break-word"
            >
              I.R.I.S. Rotation Inspector
            </Text>
            <Text
              variant="body"
              tone="muted"
              className="max-w-full text-lg leading-8 text-balance wrap-break-word"
            >
              Tooling to help calculate the efficacy of teams and rotations in Wuthering
              Waves
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
