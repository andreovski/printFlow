'use client';

import { AccountsPayable } from '@magic-system/schemas';
import { endOfMonth, startOfMonth } from 'date-fns';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  useAccountsPayable,
  useDeleteAccountsPayable,
  useDeleteAccountsPayableInfo,
  useUpdateAccountsPayable,
} from '@/app/http/hooks/use-accounts-payable';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Label } from '@/components/ui/label';
import { useDisclosure } from '@/hooks/use-disclosure';

import { AccountsPayableDialog } from './_components/accounts-payable-dialog';
import { CalendarSidebar } from './_components/calendar-sidebar';
import { DashboardKPIs } from './_components/dashboard-kpis';
import { DynamicCalendarIcon } from './_components/dynamic-calendar-icon';
import { TimelineView } from './_components/timeline-view';

type ViewMode = 'month' | 'custom';

export function AccountsPayableContent() {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [editingItem, setEditingItem] = useState<AccountsPayable | undefined>();
  const [isSingleDayFilter, setIsSingleDayFilter] = useState(false);

  const dialogDisclosure = useDisclosure();
  const deleteMutation = useDeleteAccountsPayable();
  const deleteInfoMutation = useDeleteAccountsPayableInfo();
  const updateMutation = useUpdateAccountsPayable();

  // Quando mudar para modo mês, atualizar datas
  useEffect(() => {
    if (viewMode === 'month') {
      setStartDate(startOfMonth(currentMonth));
      setEndDate(endOfMonth(currentMonth));
      setIsSingleDayFilter(false);
    }
  }, [viewMode, currentMonth]);

  // Query dos dados
  const { data, isLoading } = useAccountsPayable(
    {
      startDate,
      endDate,
    },
    { enabled: true }
  );

  const accountsPayable = data?.accountsPayable ?? [];

  const handleOpenDialog = (item?: AccountsPayable) => {
    setEditingItem(item);
    dialogDisclosure.open();
  };

  const handleDelete = async (item: AccountsPayable) => {
    try {
      const info = await deleteInfoMutation.mutateAsync(item.id);

      if (info.isParent && info.hasChildren) {
        toast(
          <div>
            <p className="font-medium">⚠️ Atenção: Parcela Principal</p>
            <p className="text-sm text-muted-foreground">
              Esta é a parcela principal. Ao excluir, {info.childrenCount} parcela
              {info.childrenCount > 1 ? 's' : ''} subsequente
              {info.childrenCount > 1 ? 's' : ''}{' '}
              {info.childrenCount > 1 ? 'serão removidas' : 'será removida'} automaticamente.
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="destructive"
                onClick={async () => {
                  try {
                    await deleteMutation.mutateAsync(item.id);
                    toast.dismiss();
                  } catch (error) {
                    console.error('Error deleting:', error);
                  }
                }}
              >
                Excluir Série Completa ({info.childrenCount + 1})
              </Button>
              <Button size="sm" variant="outline" onClick={() => toast.dismiss()}>
                Cancelar
              </Button>
            </div>
          </div>,
          {
            duration: 10000,
          }
        );
      } else {
        // Exclusão normal
        toast(
          <div>
            <p className="font-medium">Confirmar exclusão?</p>
            <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="destructive"
                onClick={async () => {
                  try {
                    await deleteMutation.mutateAsync(item.id);
                    toast.dismiss();
                  } catch (error) {
                    console.error('Error deleting:', error);
                  }
                }}
              >
                Confirmar
              </Button>
              <Button size="sm" variant="outline" onClick={() => toast.dismiss()}>
                Cancelar
              </Button>
            </div>
          </div>,
          {
            duration: 5000,
          }
        );
      }
    } catch (error) {
      console.error('Error checking delete info:', error);
      toast.error('Erro ao verificar informações de exclusão');
    }
  };

  const handlePay = async (item: AccountsPayable) => {
    try {
      await updateMutation.mutateAsync({
        id: item.id,
        data: {
          ...item,
          status: 'PAID',
          paidDate: new Date(),
          dueDate: new Date(item.dueDate),
          tagIds: item.tags?.map((t) => t.id) ?? [],
        } as any,
      });
    } catch (error) {
      console.error('Error paying:', error);
    }
  };

  const handleMonthChange = (date: Date) => {
    setCurrentMonth(date);
    if (viewMode === 'month') {
      setStartDate(startOfMonth(date));
      setEndDate(endOfMonth(date));
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setStartDate(date);
      setEndDate(date);
      setIsSingleDayFilter(true);
      setViewMode('custom');
    } else {
      setIsSingleDayFilter(false);
      setSelectedDate(undefined);
      setViewMode('month');
    }
  };

  useEffect(() => {
    if (selectedDate && !isSingleDayFilter) {
      const dateKey = selectedDate.toISOString().split('T')[0];
      const element = document.getElementById(dateKey);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [selectedDate, isSingleDayFilter]);

  return (
    <>
      <div className="flex gap-6">
        <div className="flex-1 space-y-6 min-w-0">
          <DashboardKPIs startDate={startDate} endDate={endDate} />

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* View Mode Toggle */}
              <div className="space-y-2">
                <Label>Visualização</Label>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'month' && !isSingleDayFilter ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setViewMode('month');
                      setIsSingleDayFilter(false);
                      setSelectedDate(undefined);
                    }}
                  >
                    Mês Atual
                  </Button>
                  <Button
                    variant={viewMode === 'custom' && !isSingleDayFilter ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setViewMode('custom');
                      setIsSingleDayFilter(false);
                      setSelectedDate(undefined);
                    }}
                  >
                    Personalizado
                  </Button>
                </div>
              </div>

              {/* Single Day Filter Badge */}
              {isSingleDayFilter && selectedDate && (
                <div className="space-y-2">
                  <Label>Dia Selecionado</Label>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-2 rounded-md bg-primary/10 text-sm font-medium">
                      {selectedDate.toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsSingleDayFilter(false);
                        setSelectedDate(undefined);
                        setViewMode('month');
                      }}
                    >
                      Limpar
                    </Button>
                  </div>
                </div>
              )}

              {/* Custom Date Range */}
              {viewMode === 'custom' && !isSingleDayFilter && (
                <div className="space-y-2">
                  <Label>Período</Label>
                  <DateRangePicker
                    value={{ from: startDate, to: endDate }}
                    onChange={(range) => {
                      setStartDate(range?.from);
                      setEndDate(range?.to);
                    }}
                    placeholder="Selecione o período"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Conta
            </Button>
          </div>

          {/* Timeline */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : accountsPayable.length === 0 && isSingleDayFilter && selectedDate ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <DynamicCalendarIcon date={selectedDate} className="mb-4 h-12 w-12" />
              <h3 className="text-lg font-semibold mb-2">
                Nenhum lançamento em{' '}
                {selectedDate.toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Não há contas a pagar para esta data
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setIsSingleDayFilter(false);
                  setSelectedDate(undefined);
                  setViewMode('month');
                }}
              >
                Voltar para Mês Atual
              </Button>
            </div>
          ) : (
            <TimelineView
              accountsPayable={accountsPayable}
              onEdit={handleOpenDialog}
              onDelete={handleDelete}
              onPay={handlePay}
            />
          )}
        </div>

        <CalendarSidebar
          selectedDate={selectedDate}
          onSelectDate={handleDateSelect}
          currentMonth={currentMonth}
          onMonthChange={handleMonthChange}
        />
      </div>

      {/* Dialog */}
      <AccountsPayableDialog
        open={dialogDisclosure.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            dialogDisclosure.close();
            // Aguardar o dialog fechar completamente antes de limpar
            setTimeout(() => setEditingItem(undefined), 100);
          } else {
            dialogDisclosure.open();
          }
        }}
        initialData={editingItem}
      />
    </>
  );
}
