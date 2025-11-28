'use client';

import { Paintbrush } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Paleta de cores pastéis recomendadas
const colorPalette = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#EAB308', // Yellow
  '#84CC16', // Lime
  '#22C55E', // Green
  '#10B981', // Emerald
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#0EA5E9', // Sky
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#A855F7', // Purple
  '#D946EF', // Fuchsia
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#64748B', // Slate
];

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function ColorPicker({ value, onChange, error }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-2">
      <Label>Cor</Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !value && 'text-muted-foreground',
              error && 'border-red-500'
            )}
          >
            <div className="w-4 h-4 rounded-full mr-2 border" style={{ backgroundColor: value }} />
            {value || 'Selecione uma cor'}
            <Paintbrush className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Cores predefinidas</Label>
              <div className="grid grid-cols-6 gap-2">
                {colorPalette.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      onChange(color);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'w-8 h-8 rounded-full border-2 transition-all',
                      value === color
                        ? 'border-foreground scale-110'
                        : 'border-transparent hover:scale-105'
                    )}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Cor personalizada</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder="#000000"
                  className="h-8"
                />
                <div
                  className="w-8 h-8 rounded border shrink-0"
                  style={{ backgroundColor: value }}
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
}
