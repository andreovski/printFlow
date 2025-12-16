'use client';

import { Columns2, FileText, Hash, Inbox, Kanban, Loader2, SquareDashedKanban } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

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
import { useAppContext } from '@/hooks/use-app-context';
import { formatCurrency } from '@/lib/format-currency';
import { cn, stripHtml } from '@/lib/utils';

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

export function GlobalSearchCommand({ open, onOpenChange }: GlobalSearchCommandProps) {
  const { user } = useAppContext();
  const [query, setQuery] = useState('');
  const router = useRouter();

  const { data, isLoading, isFetching } = useGlobalSearch({
    query,
    enabled: open,
  });

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

  const isAdmin = useMemo(() => {
    return user?.role === 'ADMIN' || user?.role === 'MASTER';
  }, [user?.role]);

  const descriptionFormatted = (description: string) => {
    return stripHtml(String(description));
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
                      <Badge variant="secondary" className="font-mono text-xs">
                        #{budget.code}
                      </Badge>
                      <span className="text-sm font-medium">{budget.client.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{budget.client.phone}</span>
                      <span>•</span>
                      <span>{budgetStatusMap[budget.status] || budget.status}</span>
                      {isAdmin && (
                        <>
                          <span>•</span>
                          {formatCurrency(Number(budget.total))}
                        </>
                      )}
                      <span className="font-medium text-foreground"></span>
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
                    'flex h-10 w-10 items-center justify-center rounded-md bg-primary/10'
                  )}
                >
                  <SquareDashedKanban className={cn('h-5 w-5 text-primary')} />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{card.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Kanban className="!w-4 !h-4" />
                      {card.column.board.title}
                    </span>
                    <span>•</span>
                    <span className="flex items-end gap-1">
                      <Columns2 className="!w-4 !h-4" />
                      {card.column.title}
                    </span>
                    {card.description && (
                      <>
                        <span>•</span>
                        <span className="line-clamp-1">
                          {descriptionFormatted(card.description)}
                        </span>
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
