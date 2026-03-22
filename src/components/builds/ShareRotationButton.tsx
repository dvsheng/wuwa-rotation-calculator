import { useRouter } from '@tanstack/react-router';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { buildRotationLoaderUrl } from './rotation-loader-link';

interface ShareRotationButtonProperties {
  rotationId: number;
}

export function ShareRotationButton({ rotationId }: ShareRotationButtonProperties) {
  const router = useRouter();

  const handleShare = async () => {
    const url = buildRotationLoaderUrl(rotationId, router.buildLocation);
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ url });
        toast.success('Rotation link shared.');
        return;
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Rotation link copied.');
    } catch {
      toast.error('Failed to share rotation.');
    }
  };

  return (
    <Button variant="ghost" size="icon-sm" onClick={handleShare}>
      <Share2 />
    </Button>
  );
}
