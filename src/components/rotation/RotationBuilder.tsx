import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Row, Section } from '@/components/ui/layout';
import { useRotationStore } from '@/store/useRotationStore';

import { AttackSequenceBuilder } from './attack';
import { BuffTimelineBuilder } from './buff';

export const RotationBuilder = () => {
  const clearAll = useRotationStore((state) => state.clearAll);

  return (
    <Section className="min-h-0 flex-1">
      {/* Main Card */}
      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="px-4 py-3">
          <Row className="items-center justify-between">
            <CardTitle className="text-base tracking-wider uppercase">
              Rotation Builder
            </CardTitle>
            <Row className="gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearAll()}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                Clear All
              </Button>
            </Row>
          </Row>
        </CardHeader>
        <AttackSequenceBuilder />
        <BuffTimelineBuilder />
      </Card>
    </Section>
  );
};
