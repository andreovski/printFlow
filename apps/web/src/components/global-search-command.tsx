'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  Columns2,
  FileText,
  Hash,
  Inbox,
  Kanban,
  Loader2,
  Package,
  SquareDashedKanban,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { useGlobalSearch } from '@/app/http/hooks/use-global-search';
import { notificationsQueryKey } from '@/app/http/hooks/use-notifications';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useAppContext } from '@/hooks/use-app-context';
import { formatCurrency } from '@/lib/format-currency';
import { formatDocument } from '@/lib/masks';
import { cn, stripHtml } from '@/lib/utils';

import { GlobalSearchNotifications } from './global-search-notifications';

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

export function GlobalSearchCommand({ open, onOpenChange }: Readonly<GlobalSearchCommandProps>) {
  const { user } = useAppContext();
  const [query, setQuery] = useState('');
  const [isNotificationsExpanded, setIsNotificationsExpanded] = useState(false);
  const router = useRouter();

  const { data, isLoading, isFetching } = useGlobalSearch({
    query,
    enabled: open,
  });

  const isCodeSearch = query.trim().startsWith('#');
  const isClientSearch = query.trim().startsWith('@');
  const isProductSearch = query.trim().startsWith('$');
  const hasResults =
    data &&
    (data.budgets.length > 0 ||
      data.cards.length > 0 ||
      data.clients.length > 0 ||
      data.products.length > 0);

  // Reset query when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  // Invalidar notificações quando o dialog abre para buscar atualizações
  const queryClient = useQueryClient();
  useEffect(() => {
    if (open) {
      queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
    }
  }, [open, queryClient]);

  const handleSelectBudget = (budgetId: string) => {
    router.push(`/finance/budgets/${budgetId}`);
    onOpenChange(false);
  };

  const handleSelectCard = (cardId: string) => {
    router.push(`/production/boards?cardId=${cardId}`);
    onOpenChange(false);
  };

  const handleSelectClient = (clientId: string) => {
    router.push(`/register/clients/update/${clientId}`);
    onOpenChange(false);
  };

  const handleSelectProduct = (productId: string) => {
    router.push(`/register/products/update/${productId}`);
    onOpenChange(false);
  };

  const isAdmin = useMemo(() => {
    return user?.role === 'ADMIN' || user?.role === 'MASTER';
  }, [user?.role]);

  const descriptionFormatted = (description: string) => {
    return stripHtml(String(description));
  };

  const getPlaceholder = () => {
    if (isClientSearch) return 'Buscando clientes...';
    if (isProductSearch) return 'Buscando produtos...';
    if (isCodeSearch) return 'Buscando por código de orçamento...';
    return 'Buscar orçamentos, cards, clientes e produtos...';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-transparent border-none shadow-none p-0 overflow-visible sm:max-w-[600px] flex flex-col gap-2">
        <DialogTitle className="sr-only">Busca Global</DialogTitle>

        <div className="absolute -top-10 left-0 flex w-full justify-start">
          <div className="flex flex-wrap items-center gap-2 rounded-lg">
            {!isNotificationsExpanded && (
              <>
                <Badge
                  variant={isProductSearch ? 'default' : 'secondary'}
                  className="cursor-pointer hover:bg-primary/90"
                  onClick={() => setQuery('$')}
                >
                  <Package className="mr-1 h-3 w-3" />
                  Produtos $
                </Badge>
                <Badge
                  variant={isClientSearch ? 'default' : 'secondary'}
                  className="cursor-pointer hover:bg-primary/90"
                  onClick={() => setQuery('@')}
                >
                  <User className="mr-1 h-3 w-3" />
                  Clientes @
                </Badge>
                <Badge
                  variant={isCodeSearch ? 'default' : 'secondary'}
                  className="cursor-pointer hover:bg-primary/90"
                  onClick={() => setQuery('#')}
                >
                  <Hash className="mr-1 h-3 w-3" />
                  Cód. Orçamento #
                </Badge>
              </>
            )}
          </div>
        </div>

        <Command
          shouldFilter={false}
          className="rounded-lg border shadow-md bg-background overflow-hidden relative z-20"
        >
          <CommandInput
            placeholder={getPlaceholder()}
            value={query}
            onValueChange={setQuery}
            onClick={() => setIsNotificationsExpanded(false)}
          />

          <div
            className={cn(
              'transition-all duration-300 ease-in-out',
              isNotificationsExpanded ? 'h-0 overflow-hidden opacity-0' : 'h-auto opacity-100'
            )}
          >
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
                    {isClientSearch && (
                      <p className="text-xs">Tente remover o @ para buscar em outros campos</p>
                    )}
                    {isProductSearch && (
                      <p className="text-xs">Tente remover o $ para buscar em outros campos</p>
                    )}
                  </div>
                </div>
              )}

              {data && data.budgets.length > 0 && !isClientSearch && !isProductSearch && (
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
              )}

              {data && data.budgets.length > 0 && data.cards.length > 0 && <CommandSeparator />}

              {data &&
                data.cards.length > 0 &&
                !isCodeSearch &&
                !isClientSearch &&
                !isProductSearch && (
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

              {data &&
                (data.cards.length > 0 || data.budgets.length > 0) &&
                data.clients.length > 0 && <CommandSeparator />}

              {data && data.clients.length > 0 && isClientSearch && (
                <CommandGroup heading={`Clientes (${data.clients.length})`} forceMount>
                  {data.clients.map((client) => (
                    <CommandItem
                      key={client.id}
                      value={`client-${client.id}-${client.name}`}
                      onSelect={() => handleSelectClient(client.id)}
                      className="flex items-center gap-3 py-3"
                      forceMount
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex flex-1 flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{client.name}</span>
                          {!client.active && (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              Inativo
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{client.phone}</span>
                          {client.email && (
                            <>
                              <span>•</span>
                              <span>{client.email}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{formatDocument(client.document)}</span>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {data &&
                (data.cards.length > 0 || data.budgets.length > 0 || data.clients.length > 0) &&
                data.products.length > 0 && <CommandSeparator />}

              {data && data.products.length > 0 && isProductSearch && (
                <CommandGroup heading={`Produtos (${data.products.length})`} forceMount>
                  {data.products.map((product) => (
                    <CommandItem
                      key={product.id}
                      value={`product-${product.id}-${product.title}`}
                      onSelect={() => handleSelectProduct(product.id)}
                      className="flex items-center gap-3 py-3"
                      forceMount
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex flex-1 flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{product.title}</span>
                          {!product.active && (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              Inativo
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {product.code && (
                            <>
                              <span>Cód: {product.code}</span>
                              <span>•</span>
                            </>
                          )}
                          <span>Estoque: {product.stock}</span>
                          {isAdmin && (
                            <>
                              <span>•</span>
                              <span>Venda: {formatCurrency(Number(product.salePrice))}</span>
                              <span>•</span>
                              <span>Custo: {formatCurrency(Number(product.costPrice))}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </div>

          {(isCodeSearch || isClientSearch || isProductSearch) && !isNotificationsExpanded && (
            <div className="border-t px-4 py-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {isCodeSearch && (
                  <>
                    <Hash className="h-3 w-3" />
                    <span>Buscando apenas por código de orçamento</span>
                  </>
                )}
                {isClientSearch && (
                  <>
                    <User className="h-3 w-3" />
                    <span>Buscando apenas clientes</span>
                  </>
                )}
                {isProductSearch && (
                  <>
                    <Package className="h-3 w-3" />
                    <span>Buscando apenas produtos</span>
                  </>
                )}
              </div>
            </div>
          )}
        </Command>

        <div className="mt-2 z-10 w-full">
          <GlobalSearchNotifications
            expanded={isNotificationsExpanded}
            onToggle={() => setIsNotificationsExpanded(!isNotificationsExpanded)}
            onClose={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
