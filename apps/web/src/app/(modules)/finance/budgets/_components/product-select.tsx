'use client';

import { ChevronsUpDown } from 'lucide-react';
import * as React from 'react';

import { getProducts } from '@/app/http/requests/products';
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
  const [products, setProducts] = React.useState<Product[]>([]);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const data = await getProducts({
          page: 1,
          pageSize: 10,
          search: search || undefined,
        });
        if (data.data) setProducts(data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timeout);
  }, [search]);

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
            <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
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
