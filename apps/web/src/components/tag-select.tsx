'use client';

import { Tag, TagScope } from '@magic-system/schemas';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import * as React from 'react';

import { getTags } from '@/app/http/requests/tags';
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
  scope,
  disabled,
  placeholder = 'Selecione tags...',
  className,
}: TagSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [tags, setTags] = React.useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = React.useState<Tag[]>([]);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  // Buscar tags quando o popover abre ou quando a busca muda
  React.useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      try {
        if (scope && scope !== 'GLOBAL') {
          const [scopedData, globalData] = await Promise.all([
            getTags({
              page: 1,
              pageSize: 50,
              search: search || undefined,
              scope: scope,
              active: true,
            }),
            getTags({
              page: 1,
              pageSize: 50,
              search: search || undefined,
              scope: 'GLOBAL',
              active: true,
            }),
          ]);

          // Combinar e remover duplicatas
          const allTags = [...(scopedData.data || []), ...(globalData.data || [])];
          const uniqueTags = allTags.filter(
            (tag, index, self) => index === self.findIndex((t) => t.id === tag.id)
          );
          setTags(uniqueTags);
        } else {
          const data = await getTags({
            page: 1,
            pageSize: 50,
            search: search || undefined,
            scope: scope,
            active: true,
          });
          if (data.data) setTags(data.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(fetchTags, 300);
    return () => clearTimeout(timeout);
  }, [search, scope]);

  // Sincronizar selectedTags quando value muda externamente
  React.useEffect(() => {
    const fetchSelectedTags = async () => {
      if (value.length === 0) {
        setSelectedTags([]);
        return;
      }

      try {
        const data = await getTags({
          page: 1,
          pageSize: 100,
          active: true,
        });
        if (data.data) {
          const selected = data.data.filter((tag) => value.includes(tag.id));
          setSelectedTags(selected);
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchSelectedTags();
  }, [value]);

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
              <CommandEmpty>{loading ? 'Carregando...' : 'Nenhuma tag encontrada.'}</CommandEmpty>
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
