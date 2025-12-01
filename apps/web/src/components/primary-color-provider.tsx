'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

// Cores primárias disponíveis com valores HSL para light e dark mode
export const PRIMARY_COLORS = [
  {
    name: 'Cyan',
    value: 'cyan',
    light: { primary: '192 91% 36%', ring: '192 91% 36%' },
    dark: { primary: '189 88% 53%', ring: '189 88% 53%' },
    preview: { light: 'bg-cyan-600', dark: 'bg-cyan-400' },
  },
  {
    name: 'Azul',
    value: 'blue',
    light: { primary: '221 83% 53%', ring: '221 83% 53%' },
    dark: { primary: '217 91% 60%', ring: '217 91% 60%' },
    preview: { light: 'bg-blue-600', dark: 'bg-blue-400' },
  },
  {
    name: 'Violeta',
    value: 'violet',
    light: { primary: '262 83% 58%', ring: '262 83% 58%' },
    dark: { primary: '263 70% 50%', ring: '263 70% 50%' },
    preview: { light: 'bg-violet-600', dark: 'bg-violet-400' },
  },
  {
    name: 'Rosa',
    value: 'pink',
    light: { primary: '330 81% 60%', ring: '330 81% 60%' },
    dark: { primary: '330 81% 60%', ring: '330 81% 60%' },
    preview: { light: 'bg-pink-500', dark: 'bg-pink-400' },
  },
  {
    name: 'Vermelho',
    value: 'red',
    light: { primary: '0 72% 51%', ring: '0 72% 51%' },
    dark: { primary: '0 72% 51%', ring: '0 72% 51%' },
    preview: { light: 'bg-red-600', dark: 'bg-red-500' },
  },
  {
    name: 'Laranja',
    value: 'orange',
    light: { primary: '25 95% 53%', ring: '25 95% 53%' },
    dark: { primary: '21 90% 48%', ring: '21 90% 48%' },
    preview: { light: 'bg-orange-500', dark: 'bg-orange-400' },
  },
  {
    name: 'Amarelo',
    value: 'yellow',
    light: { primary: '45 93% 47%', ring: '45 93% 47%' },
    dark: { primary: '48 96% 53%', ring: '48 96% 53%' },
    preview: { light: 'bg-yellow-500', dark: 'bg-yellow-400' },
  },
  {
    name: 'Verde',
    value: 'green',
    light: { primary: '142 71% 45%', ring: '142 71% 45%' },
    dark: { primary: '142 71% 45%', ring: '142 71% 45%' },
    preview: { light: 'bg-green-600', dark: 'bg-green-500' },
  },
  {
    name: 'Esmeralda',
    value: 'emerald',
    light: { primary: '160 84% 39%', ring: '160 84% 39%' },
    dark: { primary: '158 64% 52%', ring: '158 64% 52%' },
    preview: { light: 'bg-emerald-600', dark: 'bg-emerald-400' },
  },
  {
    name: 'Cinza',
    value: 'slate',
    light: { primary: '215 16% 47%', ring: '215 16% 47%' },
    dark: { primary: '215 20% 65%', ring: '215 20% 65%' },
    preview: { light: 'bg-slate-600', dark: 'bg-slate-400' },
  },
] as const;

export const PRIMARY_COLOR_STORAGE_KEY = 'magic-system-primary-color';

export function applyPrimaryColor(colorValue: string, currentTheme: string | undefined) {
  const color = PRIMARY_COLORS.find((c) => c.value === colorValue);
  if (!color) return;

  const isDark = currentTheme === 'dark';
  const colorSet = isDark ? color.dark : color.light;

  document.documentElement.style.setProperty('--primary', colorSet.primary);
  document.documentElement.style.setProperty('--ring', colorSet.ring);
}

interface PrimaryColorProviderProps {
  children: React.ReactNode;
}

export function PrimaryColorProvider({ children }: PrimaryColorProviderProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const savedColor = localStorage.getItem(PRIMARY_COLOR_STORAGE_KEY) || 'cyan';
    applyPrimaryColor(savedColor, resolvedTheme);
  }, [mounted, resolvedTheme]);

  return <>{children}</>;
}
