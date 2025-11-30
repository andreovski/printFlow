'use client';

import { ApprovedBudgetOption } from '@magic-system/schemas';
import { Check, ChevronsUpDown, FileText, X } from 'lucide-react';
import * as React from 'react';

import { fetchApprovedBudgets } from '@/app/http/requests/boards';
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

interface BudgetSelectProps {
  value?: string | null;
  onSelect: (budget: ApprovedBudgetOption | null) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

function formatPhone(phone: string): string {
  // Remove non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Format as (XX) XXXXX-XXXX or (XX) XXXX-XXXX
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  } else if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Filtra tags que não são exclusivas de orçamento (BUDGET scope)
 */
function filterVisibleTags(tags: ApprovedBudgetOption['tags']) {
  return tags.filter((tag) => tag.scope !== 'BUDGET');
}

/**
 * Renderiza as tags do orçamento.
 * - Até 2 tags: exibe badge com nome
 * - Mais de 2: exibe apenas círculos coloridos
 */
function BudgetTags({ tags }: { tags: ApprovedBudgetOption['tags'] }) {
  const visibleTags = filterVisibleTags(tags);

  if (visibleTags.length === 0) return null;

  // Se tiver mais de 2 tags, mostra apenas círculos coloridos
  if (visibleTags.length > 2) {
    return (
      <div className="flex items-center gap-0.5">
        {visibleTags.map((tag) => (
          <div
            key={tag.id}
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: tag.color }}
            title={tag.name}
          />
        ))}
      </div>
    );
  }

  // Se tiver até 2 tags, mostra com nome
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {visibleTags.map((tag) => (
        <span
          key={tag.id}
          className="text-[10px] px-1.5 py-0.5 rounded-sm text-white font-medium truncate max-w-[80px]"
          style={{ backgroundColor: tag.color }}
          title={tag.name}
        >
          {tag.name}
        </span>
      ))}
    </div>
  );
}

export function BudgetSelect({
  value,
  onSelect,
  disabled,
  placeholder = 'Vincular Orçamento (Opcional)',
  className,
}: BudgetSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [budgets, setBudgets] = React.useState<ApprovedBudgetOption[]>([]);
  const [selectedBudget, setSelectedBudget] = React.useState<ApprovedBudgetOption | null>(null);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  // Buscar orçamentos quando o popover abre ou quando a busca muda
  React.useEffect(() => {
    const fetchBudgets = async () => {
      setLoading(true);
      try {
        const data = await fetchApprovedBudgets(search || undefined);
        if (data.data) {
          setBudgets(data.data);

          // Se há um valor selecionado, atualiza o selectedBudget
          if (value) {
            const found = data.data.find((b) => b.id === value);
            if (found) {
              setSelectedBudget(found);
            }
          }
        }
      } catch (e) {
        console.error('Erro ao buscar orçamentos aprovados:', e);
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(fetchBudgets, 300);
    return () => clearTimeout(timeout);
  }, [search, value]);

  // Sincronizar selectedBudget quando value muda externamente
  React.useEffect(() => {
    if (!value) {
      setSelectedBudget(null);
      return;
    }

    // Se já temos os budgets carregados, busca neles
    const found = budgets.find((b) => b.id === value);
    if (found) {
      setSelectedBudget(found);
    }
  }, [value, budgets]);

  const handleSelect = (budget: ApprovedBudgetOption) => {
    if (value === budget.id) {
      // Desselecionar
      setSelectedBudget(null);
      onSelect(null);
    } else {
      setSelectedBudget(budget);
      onSelect(budget);
    }
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBudget(null);
    onSelect(null);
  };

  const getBudgetLabel = (budget: ApprovedBudgetOption): string => {
    return `#${budget.code} - ${budget.client.name} - ${formatCurrency(Number(budget.total))}`;
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-10 px-3"
            disabled={disabled}
          >
            {selectedBudget ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FileText className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">{getBudgetLabel(selectedBudget)}</span>
                {selectedBudget.tags && selectedBudget.tags.length > 0 && (
                  <div className="shrink-0">
                    <BudgetTags tags={selectedBudget.tags} />
                  </div>
                )}
                {!disabled && (
                  <button
                    type="button"
                    className="ml-auto hover:opacity-70 shrink-0"
                    onClick={handleClear}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Buscar por cliente, telefone ou código..."
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                {loading ? 'Carregando...' : 'Nenhum orçamento aprovado encontrado.'}
              </CommandEmpty>
              <CommandGroup>
                {budgets.map((budget) => (
                  <CommandItem
                    key={budget.id}
                    value={`${budget.code} ${budget.client.name} ${budget.client.phone}`}
                    onSelect={() => handleSelect(budget)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === budget.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">#{budget.code}</span>
                        <span className="text-muted-foreground">-</span>
                        <span className="truncate">{budget.client.name}</span>
                        {budget.tags && budget.tags.length > 0 && (
                          <div className="shrink-0 ml-auto">
                            <BudgetTags tags={budget.tags} />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatPhone(budget.client.phone)}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(Number(budget.total))}
                        </span>
                      </div>
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
