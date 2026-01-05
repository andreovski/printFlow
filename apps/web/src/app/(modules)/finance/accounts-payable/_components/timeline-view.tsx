'use client';

import { AccountsPayable } from '@magic-system/schemas';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, Edit, Trash2 } from 'lucide-react';
import { useMemo } from 'react';

import { FINANCIAL_ICONS, FinancialIconName } from '@/components/icon-picker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { StatusBadge } from './status-badge';

interface TimelineViewProps {
  accountsPayable: AccountsPayable[];
  onEdit: (item: AccountsPayable) => void;
  onDelete: (item: AccountsPayable) => void;
  onPay: (item: AccountsPayable) => void;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function TimelineView({ accountsPayable, onEdit, onDelete, onPay }: TimelineViewProps) {
  const groupedByDate = useMemo(() => {
    const groups: Record<string, AccountsPayable[]> = {};

    accountsPayable.forEach((item) => {
      const dateKey = format(parseISO(item.dueDate), 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [accountsPayable]);

  if (groupedByDate.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-semibold mb-2">Nenhuma conta a pagar encontrada</h3>
        <p className="text-sm text-muted-foreground">
          Adicione uma nova conta a pagar para começar
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groupedByDate.map(([dateKey, items]) => {
        const date = parseISO(dateKey);
        const formattedDate = format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });

        return (
          <div key={dateKey} id={dateKey} className="scroll-mt-4">
            <div className="sticky top-0 bg-background/95 backdrop-blur z-10 py-2 mb-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold capitalize">{formattedDate}</h3>
                <span className="text-sm text-muted-foreground">{items.length} conta(s)</span>
              </div>
            </div>

            <div className="grid gap-3">
              {items.map((item) => {
                const Icon = item.icon
                  ? FINANCIAL_ICONS[item.icon as FinancialIconName]
                  : FINANCIAL_ICONS.DollarSign;

                const isInstallment = item.installmentNumber && item.installmentOf;

                return (
                  <Card
                    key={item.id}
                    className={cn(
                      'hover:shadow-md transition-shadow',
                      isInstallment && 'border-l-4 border-l-primary/30'
                    )}
                  >
                    <CardContent className="p-2">
                      <div className="flex items-start gap-4">
                        {/* Ícone */}
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                        </div>

                        {/* Conteúdo */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-base truncate">
                                  {item.supplier}
                                </h4>
                                {isInstallment && (
                                  <Badge variant="secondary" className="text-xs">
                                    {item.installmentNumber}/{item.installmentOf}
                                  </Badge>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="font-bold text-lg">{formatCurrency(item.amount)}</div>
                              {item.installments > 1 && (
                                <div className="text-xs text-muted-foreground">
                                  Soma: {formatCurrency(item.totalAmount)}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                              <StatusBadge status={item.status} />
                              {item.tags && item.tags.length > 0 && (
                                <div className="flex gap-1">
                                  {item.tags.map((tag) => (
                                    <span
                                      key={tag.id}
                                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-background"
                                      style={{
                                        backgroundColor: `${tag.color}`,
                                      }}
                                    >
                                      {tag.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex gap-1 mt-2">
                              <Button variant="outline" onClick={() => onEdit(item)} title="Editar">
                                <Edit className="h-4 w-4" />
                                Editar
                              </Button>
                              {item.status !== 'PAID' && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => onPay(item)}
                                  title="Marcar como pago"
                                  className="hover:bg-green-600 hover:text-background"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                              )}

                              <Button
                                variant="outline"
                                size="icon"
                                className="hover:bg-red-500 hover:text-white"
                                onClick={() => onDelete(item)}
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
