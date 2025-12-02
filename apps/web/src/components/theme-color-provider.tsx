'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

// Temas completos disponíveis
export const COMPLETE_THEMES = [
  {
    name: 'Âmbar',
    value: 'ambar',
    description: 'Tom quente e aconchegante',
    preview: {
      light: { background: '#fffcf4', primary: '#d97706', border: '#ffd48e' },
      dark: { background: '#222222', primary: '#b56405', border: '#3b3934' },
    },
  },
  {
    name: 'Sky',
    value: 'sky',
    description: 'Azul claro e refrescante',
    preview: {
      light: { background: '#fffcf4', primary: '#0284c7', border: '#bae6fd' },
      dark: { background: '#222222', primary: '#0369a1', border: '#3b3934' },
    },
  },
  {
    name: 'Violeta',
    value: 'violet',
    description: 'Elegante e sofisticado',
    preview: {
      light: { background: '#eeeeee', primary: '#43394b', border: '#b3aac6' },
      dark: { background: '#1a1620', primary: '#3c3243', border: '#2b2331' },
    },
  },
  {
    name: 'Cappuccino',
    value: 'cappuccino',
    description: 'Marrom suave e acolhedor',
    preview: {
      light: { background: '#f1e8e2', primary: '#8f5c38', border: '#c6a083' },
      dark: { background: '#1a1410', primary: '#804a29', border: '#61260c' },
    },
  },
  {
    name: 'Ice',
    value: 'ice',
    description: 'Azul gelo e clean',
    preview: {
      light: { background: '#f0f5f7', primary: '#166187', border: '#8fb7cc' },
      dark: { background: '#0a1f2b', primary: '#145773', border: '#0e384b' },
    },
  },
  {
    name: 'Lilac',
    value: 'lilac',
    description: 'Rosa suave e delicado',
    preview: {
      light: { background: '#fef8f9', primary: '#cf9aa5', border: '#e7bcc4' },
      dark: { background: '#23222b', primary: '#cf9aa5', border: '#80585d' },
    },
  },
] as const;

export const THEME_STORAGE_KEY = 'magic-system-complete-theme';
export const THEME_ENABLED_KEY = 'magic-system-theme-enabled';

export function applyCompleteTheme(themeValue: string, currentMode: string | undefined) {
  const theme = COMPLETE_THEMES.find((t) => t.value === themeValue);
  if (!theme) return;

  const isDark = currentMode === 'dark';
  const themeClass = isDark ? `${themeValue}-dark` : themeValue;

  // Remove todas as classes de tema existentes
  document.documentElement.classList.forEach((className) => {
    if (COMPLETE_THEMES.some((t) => className === t.value || className === `${t.value}-dark`)) {
      document.documentElement.classList.remove(className);
    }
  });

  // Adiciona a nova classe de tema
  document.documentElement.classList.add(themeClass);

  // Remove estilos inline que podem sobrescrever o tema
  document.documentElement.style.removeProperty('--primary');
  document.documentElement.style.removeProperty('--ring');
}

export function removeCompleteTheme() {
  // Remove todas as classes de tema
  document.documentElement.classList.forEach((className) => {
    if (COMPLETE_THEMES.some((t) => className === t.value || className === `${t.value}-dark`)) {
      document.documentElement.classList.remove(className);
    }
  });
}

interface ThemeColorProviderProps {
  children: React.ReactNode;
}

export function ThemeColorProvider({ children }: ThemeColorProviderProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const themeEnabled = localStorage.getItem(THEME_ENABLED_KEY) === 'true';

    if (themeEnabled) {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'ambar';
      applyCompleteTheme(savedTheme, resolvedTheme);
    } else {
      removeCompleteTheme();
    }
  }, [mounted, resolvedTheme]);

  return <>{children}</>;
}
