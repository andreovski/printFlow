'use client';

import { Organization } from '@magic-system/schemas';
import { createContext, useContext } from 'react';

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export const AppContext = createContext<{
  organization: Organization | null;
  user: UserProfile | null;
}>({
  organization: null,
  user: null,
});

interface AppContextProviderProps {
  children: React.ReactNode;
  organization: Organization | null;
  user?: UserProfile | null;
}

export function AppContextProvider({
  children,
  organization,
  user = null,
}: AppContextProviderProps) {
  return <AppContext.Provider value={{ organization, user }}>{children}</AppContext.Provider>;
}

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};
