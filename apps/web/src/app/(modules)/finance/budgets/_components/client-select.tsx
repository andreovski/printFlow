'use client';

import { Check, ChevronsUpDown } from 'lucide-react';
import * as React from 'react';

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
import { useClients, useClient } from '@/app/http/hooks';
import { cn } from '@/lib/utils';

interface ClientSelectProps {
  value?: string;
  onSelect: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function ClientSelect({ value, onSelect, error, disabled }: ClientSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');

  // Debounce da busca
  React.useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  // Usar React Query para buscar lista de clientes (com cache automático)
  const { data: clientsData, isLoading } = useClients({
    search: debouncedSearch || undefined,
    pageSize: 10,
  });

  // Usar React Query para buscar dados do cliente selecionado
  const { data: selectedClientData } = useClient(value);

  const clients = clientsData?.data || [];
  const selectedLabel = selectedClientData?.client?.name || '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', error && 'border-red-500')}
          disabled={disabled}
        >
          {selectedLabel || 'Selecione um cliente...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Buscar cliente..." onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>
              {isLoading ? 'Carregando...' : 'Nenhum cliente encontrado.'}
            </CommandEmpty>
            <CommandGroup>
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={client.name}
                  onSelect={() => {
                    onSelect(client.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === client.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {client.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
