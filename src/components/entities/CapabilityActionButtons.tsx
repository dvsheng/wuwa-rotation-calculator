import { useSession } from '@/lib/auth-client';
import type { Capability } from '@/services/game-data';

import { ButtonGroup } from '../ui/button-group';

import { DeleteCapabilityButton } from './DeleteCapabilityButton';
import { ReportCapabilityIssueButton } from './ReportCapabilityIssueButton';
import { UpdateCapabilityDialog } from './UpdateCapabilityDialog';

interface CapabilityActionButtonsProperties {
  capability: Capability;
  alternativeDefinition?: string;
}

export const CapabilityActionButtons = ({
  capability,
  alternativeDefinition,
}: CapabilityActionButtonsProperties) => {
  const { data: session } = useSession();
  const isAdmin = session?.user.role === 'admin';

  return (
    <ButtonGroup>
      <ReportCapabilityIssueButton
        capability={capability}
        alternativeDefinition={alternativeDefinition}
      />
      {isAdmin && <UpdateCapabilityDialog capability={capability} />}
      {isAdmin && <DeleteCapabilityButton capability={capability} />}
    </ButtonGroup>
  );
};
