'use client';

import { useEffect, useState } from 'react';

import { GlobalSearchCommand } from './global-search-command';

export function GlobalSearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => {
          const newState = !open;
          return newState;
        });
      }
    };

    document.addEventListener('keydown', down);
    return () => {
      document.removeEventListener('keydown', down);
    };
  }, []);

  return (
    <>
      {children}
      <GlobalSearchCommand open={open} onOpenChange={setOpen} />
    </>
  );
}
