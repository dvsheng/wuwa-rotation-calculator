import { createContext, useContext } from 'react';

export const RotationSectionSheetContainerContext = createContext<
  HTMLElement | undefined
>(undefined);

export const useRotationSectionSheetContainer = () =>
  useContext(RotationSectionSheetContainerContext);
