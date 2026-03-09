import { createContext, useContext } from 'react';

export interface RotationResultInspectorSelection {
  attackIndex: number;
  hitIndex: number;
}

interface RotationResultPopoverContextValue {
  popoverSelection: RotationResultInspectorSelection | undefined;
  setPopoverSelection: (
    selection: RotationResultInspectorSelection | undefined,
  ) => void;
  inspectorPortalNode: HTMLDivElement | undefined;
  setInspectorPortalNode: (node: HTMLDivElement | undefined) => void;
}

const RotationResultPopoverContext = createContext<
  RotationResultPopoverContextValue | undefined
>(undefined);

export const RotationResultPopoverProvider = RotationResultPopoverContext.Provider;

export const useRotationResultPopover = () => {
  const context = useContext(RotationResultPopoverContext);
  if (!context) {
    throw new TypeError(
      'useRotationResultPopover must be used within RotationResultPopoverProvider',
    );
  }
  return context;
};
