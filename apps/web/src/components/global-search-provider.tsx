'use client';

import { useEffect, useState } from 'react';

import { GlobalSearchCommand } from './global-search-command';

export function GlobalSearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        console.log('[GlobalSearchProvider] Cmd+K pressed, toggling modal. Current:', open);
        setOpen((open) => {
          const newState = !open;
          console.log('[GlobalSearchProvider] New modal state:', newState);
          return newState;
        });
      }
    };

    console.log('[GlobalSearchProvider] Mounted, adding keyboard listener');
    document.addEventListener('keydown', down);
    return () => {
      console.log('[GlobalSearchProvider] Unmounting, removing keyboard listener');
      document.removeEventListener('keydown', down);
    };
  }, []);

  console.log('[GlobalSearchProvider] Render, open:', open);

  return (
    <>
      {children}
      <GlobalSearchCommand open={open} onOpenChange={setOpen} />
    </>
  );
}
