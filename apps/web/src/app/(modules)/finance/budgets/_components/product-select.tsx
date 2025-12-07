'use client';

import { ChevronsUpDown } from 'lucide-react';
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
import { useProducts } from '@/app/http/hooks';

interface Product {
  id: string;
  title: string;
  salePrice: number;
  costPrice: number;
}

interface ProductSelectProps {
  onSelect: (product: Product) => void;
  disabled?: boolean;
}

export function ProductSelect({ onSelect, disabled }: ProductSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');

  // Debounce da busca
  React.useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  // Usar React Query para buscar produtos (com cache automático)
  const { data: productsData, isLoading } = useProducts({
    search: debouncedSearch || undefined,
    pageSize: 10,
  });

  const products = productsData?.data || [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          Adicionar Produto...
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Buscar produto..." onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>
              {isLoading ? 'Carregando...' : 'Nenhum produto encontrado.'}
            </CommandEmpty>
            <CommandGroup>
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.title}
                  onSelect={() => {
                    onSelect(product);
                    setOpen(false);
                  }}
                >
                  {product.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
