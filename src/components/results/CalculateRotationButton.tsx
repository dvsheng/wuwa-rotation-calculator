import { Play } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useRotationCalculation } from '@/hooks/useRotationCalculation';

interface CalculateRotationButtonProperties {
  onCalculated?: () => void;
}

export function CalculateRotationButton({
  onCalculated,
}: CalculateRotationButtonProperties) {
  const { refetch, isFetching } = useRotationCalculation();

  const handleCalculateClick = async () => {
    try {
      const { isError, error } = await refetch();
      if (isError) {
        toast.error('Calculation Failed', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
        return;
      }

      onCalculated?.();
    } catch (error) {
      console.error('Calculation failed', error);
      toast.error('An unexpected error occurred', {
        description: 'Please try again later.',
      });
    }
  };

  return (
    <Button
      size="sm"
      onClick={() => void handleCalculateClick()}
      disabled={isFetching}
      className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20 font-bold shadow-lg"
    >
      <Play className="mr-2 h-4 w-4 fill-current" />
      {isFetching ? 'Calculating...' : 'Calculate Rotation Damage'}
    </Button>
  );
}
