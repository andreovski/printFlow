'use client';

import { Tag, TagScope } from '@magic-system/schemas';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTagsWithGlobal } from '@/app/http/hooks';
import { cn } from '@/lib/utils';

interface TagSelectProps {
  value?: string[];
  onSelect: (value: string[]) => void;
  scope?: TagScope;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function TagSelect({
  value = [],
  onSelect,
  scope = 'GLOBAL',
  disabled,
  placeholder = 'Selecione tags...',
  className,
}: TagSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  // Usar React Query para buscar tags (com cache automático)
  const { data: tags = [], isLoading } = useTagsWithGlobal(scope, search || undefined);

  // Filtrar tags selecionadas a partir dos dados em cache
  const selectedTags = React.useMemo(() => {
    if (value.length === 0) return [];
    return tags.filter((tag) => value.includes(tag.id));
  }, [tags, value]);

  const handleSelect = (tag: Tag) => {
    const isSelected = value.includes(tag.id);
    let newValue: string[];

    if (isSelected) {
      newValue = value.filter((id) => id !== tag.id);
    } else {
      newValue = [...value, tag.id];
    }

    onSelect(newValue);
  };

  const handleRemove = (tagId: string) => {
    const newValue = value.filter((id) => id !== tagId);
    onSelect(newValue);
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-10 px-2"
            disabled={disabled}
          >
            {selectedTags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {selectedTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    style={{
                      backgroundColor: tag.color,
                    }}
                    className="rounded-sm"
                  >
                    {tag.name}
                    <span
                      role="button"
                      tabIndex={disabled ? -1 : 0}
                      className="ml-1 hover:opacity-70 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!disabled) handleRemove(tag.id);
                      }}
                      onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
                          e.stopPropagation();
                          handleRemove(tag.id);
                        }
                      }}
                      aria-disabled={disabled}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar tag..." onValueChange={setSearch} />
            <CommandList>
              <CommandEmpty>{isLoading ? 'Carregando...' : 'Nenhuma tag encontrada.'}</CommandEmpty>
              <CommandGroup>
                {tags.map((tag) => (
                  <CommandItem key={tag.id} value={tag.name} onSelect={() => handleSelect(tag)}>
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value.includes(tag.id) ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
