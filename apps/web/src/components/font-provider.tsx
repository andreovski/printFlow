'use client';

import { useEffect, useState } from 'react';

export const FONTS = [
  {
    name: 'Josefin',
    value: 'josefin-sans',
    class: 'font-josefin-sans',
    description: 'Fonte padrão',
  },
  {
    name: 'Sans',
    value: 'sans',
    class: 'font-sans',
    description: 'Fonte sem serifa',
  },
  {
    name: 'Serif',
    value: 'serif',
    class: 'font-serif',
    description: 'Elegante e clássica',
  },
] as const;

export const FONT_STORAGE_KEY = 'magic-system-font';

export function applyFont(fontValue: string) {
  const font = FONTS.find((f) => f.value === fontValue);
  if (!font) return;

  // Remove existing font classes
  FONTS.forEach((f) => {
    document.body.classList.remove(f.class);
  });

  // Add new font class
  document.body.classList.add(font.class);
}

interface FontProviderProps {
  children: React.ReactNode;
}

export function FontProvider({ children }: FontProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const savedFont = localStorage.getItem(FONT_STORAGE_KEY) || 'sans';
    applyFont(savedFont);
  }, [mounted]);

  return <>{children}</>;
}
