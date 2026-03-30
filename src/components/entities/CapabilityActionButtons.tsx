import { useSession } from '@/lib/auth-client';
import type { Capability } from '@/services/game-data';

import { ButtonGroup } from '../ui/button-group';

import { DeleteCapabilityDialog } from './DeleteCapabilityDialog';
import { ReportCapabilityIssueDialog } from './ReportCapabilityIssueDialog';
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
      <ReportCapabilityIssueDialog
        capability={capability}
        alternativeDefinition={alternativeDefinition}
      />
      {isAdmin && <UpdateCapabilityDialog capability={capability} />}
      {isAdmin && <DeleteCapabilityDialog capability={capability} />}
    </ButtonGroup>
  );
};
