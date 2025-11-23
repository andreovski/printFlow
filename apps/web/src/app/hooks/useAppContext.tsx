'use client';

import { Organization } from '@magic-system/schemas';
import { createContext, useContext } from 'react';

export const AppContext = createContext<{
  organization: Organization | null;
}>({
  organization: null,
});

interface AppContextProviderProps {
  children: React.ReactNode;
  organization: Organization | null;
}

export function AppContextProvider({ children, organization }: AppContextProviderProps) {
  return <AppContext.Provider value={{ organization }}>{children}</AppContext.Provider>;
}

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};
