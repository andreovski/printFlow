'use client';

import {
  Building2,
  Calculator,
  CreditCard,
  DollarSign,
  PiggyBank,
  ShoppingCart,
  Truck,
  Wifi,
  Banknote,
  Ellipsis,
  Boxes,
  Drill,
  Factory,
  GraduationCap,
  HardDrive,
  Laptop,
  RefreshCcw,
  ShoppingBasket,
  Ham,
  Database,
  Container,
} from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';

import { Label } from './ui/label';

// Mapeamento de ícones financeiros disponíveis
export const FINANCIAL_ICONS = {
  Ellipsis,
  DollarSign,
  CreditCard,
  Banknote,
  Boxes,
  Drill,
  Factory,
  GraduationCap,
  HardDrive,
  Laptop,
  RefreshCcw,
  ShoppingBasket,
  Ham,
  Database,
  Container,
  Calculator,
  Building2,
  PiggyBank,
  ShoppingCart,
  Truck,
  Wifi,
} as const;

export type FinancialIconName = keyof typeof FINANCIAL_ICONS;

interface IconPickerProps {
  value?: string | null;
  onChange: (icon: string | null) => void;
  label?: string;
}

export function IconPicker({ value, onChange, label = 'Ícone' }: Readonly<IconPickerProps>) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectIcon = (iconName: string) => {
    onChange(iconName);
    setIsOpen(false);
  };

  const SelectedIcon = value && FINANCIAL_ICONS[value as FinancialIconName];

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex h-10 w-full items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors',
            'hover:bg-accent hover:text-accent-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          {SelectedIcon ? (
            <SelectedIcon className="h-5 w-5" />
          ) : (
            <span className="text-muted-foreground">Selecionar ícone</span>
          )}
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

            {/* Dropdown */}
            <div className="absolute left-0 top-full z-50 mt-2 min-w-[280px] rounded-md border bg-popover p-4 shadow-md">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium">Selecione um ícone</span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {Object.entries(FINANCIAL_ICONS).map(([name, Icon]) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleSelectIcon(name)}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-md border transition-all',
                      'hover:bg-accent hover:scale-110',
                      value === name ? 'border-primary border-2 bg-accent' : 'border-input'
                    )}
                    title={name}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
