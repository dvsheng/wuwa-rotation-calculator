import { Play } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Row } from '@/components/ui/layout';
import { useRotationCalculation } from '@/hooks/useRotationCalculation';
import { useRotationStore } from '@/store/useRotationStore';

import { RotationResultDisplay } from './RotationResultDisplay';

/**
 * Handles rotation calculation logic and displays the result and controls.
 */
export const RotationSummary = () => {
  const [showResult, setShowResult] = useState(false);
  const {
    data: result,
    refetch,
    isFetching,
    isPlaceholderData,
  } = useRotationCalculation();
  const isCalculateButtonVisible = useRotationStore(
    (state) => state.attacks.length > 0,
  );

  const handleClick = async () => {
    try {
      const { isError, error } = await refetch();
      if (isError) {
        toast.error('Calculation Failed', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
        return;
      }
      setShowResult(true);
    } catch (error) {
      console.error('Calculation failed', error);
      toast.error('An unexpected error occurred', {
        description: 'Please try again later.',
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Row className="justify-end">
        {isCalculateButtonVisible && (
          <Button
            size="sm"
            onClick={handleClick}
            disabled={isFetching}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20 font-bold shadow-lg"
          >
            <Play className="mr-2 h-4 w-4 fill-current" />
            {isFetching ? 'Calculating...' : 'Calculate Rotation Damage'}
          </Button>
        )}
      </Row>
      {showResult && result && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <RotationResultDisplay result={result} isStale={isPlaceholderData} />
        </div>
      )}
    </div>
  );
};
