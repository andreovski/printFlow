'use client';

import { Check, ChevronsUpDown } from 'lucide-react';
import * as React from 'react';

import { getClient, getClients } from '@/app/http/requests/clients';
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

interface Client {
  id: string;
  name: string;
}

interface ClientSelectProps {
  value?: string;
  onSelect: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function ClientSelect({ value, onSelect, error, disabled }: ClientSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [selectedLabel, setSelectedLabel] = React.useState('');

  // Debounce search manually if hook not available or just use effect
  React.useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      try {
        const data = await getClients({
          page: 1,
          pageSize: 10,
          search: search || undefined,
        });
        if (data.data) setClients(data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(fetchClients, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  React.useEffect(() => {
    if (value) {
      getClient(value)
        .then((data) => {
          if (data.client) setSelectedLabel(data.client.name);
        })
        .catch(console.error);
    }
  }, [value]);

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
            <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
            <CommandGroup>
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={client.name}
                  onSelect={() => {
                    onSelect(client.id);
                    setSelectedLabel(client.name);
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
