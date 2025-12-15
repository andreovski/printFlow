'use client';

import { FileText, Hash, Inbox, Loader2, Square } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useGlobalSearch } from '@/app/http/hooks/use-global-search';
import { Badge } from '@/components/ui/badge';
import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { formatCurrency } from '@/lib/format-currency';
import { cn } from '@/lib/utils';

interface GlobalSearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const budgetStatusMap: Record<string, string> = {
  DRAFT: 'Rascunho',
  SENT: 'Enviado',
  ACCEPTED: 'Aceito',
  REJECTED: 'Rejeitado',
  DONE: 'Concluído',
};

const cardPriorityMap: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

export function GlobalSearchCommand({ open, onOpenChange }: GlobalSearchCommandProps) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  console.log('[GlobalSearchCommand] State:', { open, query });

  const { data, isLoading, isFetching, error } = useGlobalSearch({
    query,
    enabled: open,
  });

  console.log('[GlobalSearchCommand] Query result:', { data, isLoading, isFetching, error });

  const isCodeSearch = query.trim().startsWith('#');
  const hasResults = data && (data.budgets.length > 0 || data.cards.length > 0);

  // Reset query when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  const handleSelectBudget = (budgetId: string) => {
    router.push(`/finance/budgets/${budgetId}`);
    onOpenChange(false);
  };

  const handleSelectCard = (cardId: string) => {
    router.push(`/production/boards?cardId=${cardId}`);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} shouldFilter={false}>
      <CommandInput
        placeholder={
          isCodeSearch
            ? 'Buscando por código de orçamento...'
            : 'Buscar orçamentos e cards... (use # para buscar por código)'
        }
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {query.length < 3 && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <Inbox className="h-8 w-8" />
              <p>Digite no mínimo 3 caracteres para buscar</p>
            </div>
          </div>
        )}

        {query.length >= 3 && (isLoading || isFetching) && (
          <div className="py-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Buscando...</p>
            </div>
          </div>
        )}

        {query.length >= 3 && !isLoading && !isFetching && !hasResults && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <Inbox className="h-8 w-8" />
              <p>Nenhum resultado encontrado</p>
              {isCodeSearch && (
                <p className="text-xs">Tente remover o # para buscar em outros campos</p>
              )}
            </div>
          </div>
        )}

        {data && data.budgets.length > 0 && (
          <>
            <CommandGroup heading={`Orçamentos (${data.budgets.length})`} forceMount>
              {data.budgets.map((budget) => (
                <CommandItem
                  key={budget.id}
                  value={`budget-${budget.id}-${budget.code}-${budget.client.name}`}
                  onSelect={() => handleSelectBudget(budget.id)}
                  className="flex items-center gap-3 py-3"
                  forceMount
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        #{budget.code}
                      </Badge>
                      <span className="text-sm font-medium">{budget.client.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{budget.client.phone}</span>
                      <span>•</span>
                      <span>{budgetStatusMap[budget.status] || budget.status}</span>
                      <span>•</span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(Number(budget.total))}
                      </span>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {data && data.budgets.length > 0 && data.cards.length > 0 && <CommandSeparator />}

        {data && data.cards.length > 0 && !isCodeSearch && (
          <CommandGroup heading={`Cards (${data.cards.length})`} forceMount>
            {data.cards.map((card) => (
              <CommandItem
                key={card.id}
                value={`card-${card.id}-${card.title}`}
                onSelect={() => handleSelectCard(card.id)}
                className="flex items-center gap-3 py-3"
                forceMount
              >
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-md',
                    card.priority === 'URGENT' && 'bg-red-500/10',
                    card.priority === 'HIGH' && 'bg-orange-500/10',
                    card.priority === 'MEDIUM' && 'bg-blue-500/10',
                    card.priority === 'LOW' && 'bg-gray-500/10',
                    !card.priority && 'bg-gray-500/10'
                  )}
                >
                  <Square
                    className={cn(
                      'h-5 w-5',
                      card.priority === 'URGENT' && 'text-red-500',
                      card.priority === 'HIGH' && 'text-orange-500',
                      card.priority === 'MEDIUM' && 'text-blue-500',
                      card.priority === 'LOW' && 'text-gray-500',
                      !card.priority && 'text-gray-500'
                    )}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{card.title}</span>
                    {card.priority && (
                      <Badge variant="outline" className="text-xs">
                        {cardPriorityMap[card.priority]}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{card.column.board.title}</span>
                    <span>•</span>
                    <span>{card.column.title}</span>
                    {card.description && (
                      <>
                        <span>•</span>
                        <span className="line-clamp-1">{card.description}</span>
                      </>
                    )}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>

      {isCodeSearch && (
        <div className="border-t px-4 py-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Hash className="h-3 w-3" />
            <span>Buscando apenas por código de orçamento</span>
          </div>
        </div>
      )}
    </CommandDialog>
  );
}
