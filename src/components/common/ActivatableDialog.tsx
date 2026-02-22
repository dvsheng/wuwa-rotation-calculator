import { Dialog } from '../ui/dialog';

type ActivatableDialogProperties = {
  children: React.ReactNode;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isDialogClickable?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
};

export function ActivatableDialog({
  children,
  isOpen,
  setIsOpen,
  isDialogClickable,
  onOpenChange,
}: ActivatableDialogProperties) {
  const handleOnOpenChange = (open: boolean) => {
    if (!isDialogClickable) return;
    onOpenChange?.(open);
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOnOpenChange}>
      {children}
    </Dialog>
  );
}
