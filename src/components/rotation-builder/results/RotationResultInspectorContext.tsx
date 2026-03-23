import { PanelRightCloseIcon } from 'lucide-react';
import { createContext, useContext, useEffect, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

type RotationResultInspectorContextValue = {
  portalNode: HTMLElement | undefined;
  setPortalNode: (node: HTMLDivElement | undefined) => void;
  hasInspectorContent: boolean;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  register: () => void;
  unregister: () => void;
};

export const RotationResultInspectorContext = createContext<
  RotationResultInspectorContextValue | undefined
>(undefined);

export const RotationResultInspectorProvider = ({ children }: PropsWithChildren) => {
  const [portalNode, setPortalNode] = useState<HTMLDivElement | undefined>();
  const [inspectorContentCount, setInspectorContentCount] = useState(0);
  const [isOpen, setIsOpen] = useState(true);
  const [inspectorRegistration] = useState(() => ({
    register: () => {
      setIsOpen(true);
      setInspectorContentCount((count) => count + 1);
    },
    unregister: () => setInspectorContentCount((count) => Math.max(0, count - 1)),
  }));

  return (
    <RotationResultInspectorContext.Provider
      value={{
        portalNode,
        setPortalNode,
        hasInspectorContent: inspectorContentCount > 0,
        isOpen,
        setIsOpen,
        register: inspectorRegistration.register,
        unregister: inspectorRegistration.unregister,
      }}
    >
      {children}
    </RotationResultInspectorContext.Provider>
  );
};

export const RotationResultInspectorPanel = () => {
  const context = useContext(RotationResultInspectorContext);

  if (!context?.hasInspectorContent || !context.isOpen) {
    return;
  }

  return (
    <aside className="bg-card p-panel fixed inset-0 z-100 flex min-h-0 flex-col md:absolute md:inset-y-0 md:right-0 md:left-auto md:h-full md:w-md md:border-l">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => context.setIsOpen(false)}
      >
        <PanelRightCloseIcon />
      </Button>
      <ScrollArea
        className="min-h-0 flex-1"
        orientation="both"
        viewportClassName="pb-panel"
      >
        <div
          className="min-h-full"
          ref={(node) => context.setPortalNode(node ?? undefined)}
        />
      </ScrollArea>
    </aside>
  );
};

export const InspectorContent = ({ children }: PropsWithChildren) => {
  const context = useContext(RotationResultInspectorContext);
  const portalNode = context?.portalNode;
  const register = context?.register;
  const unregister = context?.unregister;
  const setIsOpen = context?.setIsOpen;

  useEffect(() => {
    if (!register || !unregister) {
      return;
    }

    register();

    return unregister;
  }, [register, unregister]);

  useEffect(() => {
    if (!children || !setIsOpen) {
      return;
    }

    setIsOpen(true);
  }, [children, setIsOpen]);

  if (!portalNode) {
    return;
  }

  return createPortal(children, portalNode);
};
