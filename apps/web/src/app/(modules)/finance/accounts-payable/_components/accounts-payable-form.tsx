'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  createAccountsPayableSchema,
  updateAccountsPayableSchema,
  AccountsPayable,
  accountsPayableStatusLabel,
} from '@magic-system/schemas';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { IconPicker } from '@/components/icon-picker';
import { TagSelect } from '@/components/tag-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { maskCurrency } from '@/lib/masks';

type FormData = z.infer<typeof createAccountsPayableSchema>;

interface AccountsPayableFormProps {
  initialData?: AccountsPayable;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  onAmountChange?: (hasSubsequent: boolean, subsequentCount: number) => void;
  isSubmitting?: boolean;
}

export function AccountsPayableForm({
  initialData,
  onSubmit,
  onCancel,
  onAmountChange,
  isSubmitting,
}: AccountsPayableFormProps) {
  // Usar schema correto dependendo se está criando ou editando
  const schema = initialData ? updateAccountsPayableSchema : createAccountsPayableSchema;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData
      ? {
          supplier: initialData.supplier,
          icon: initialData.icon || 'Ellipsis',
          dueDate: new Date(initialData.dueDate),
          // Na edição, se é parcela, mostrar o valor individual (amount)
          // O totalAmount será usado apenas para exibição da soma
          amount: initialData.amount,
          status: initialData.status || 'PENDING',
          installments: initialData.installments,
          tagIds: initialData.tags?.map((t) => t.id) ?? [],
          description: initialData.description,
          paidDate: initialData.paidDate ? new Date(initialData.paidDate) : null,
        }
      : {
          status: 'PENDING' as const,
          installments: 1,
          tagIds: [],
          icon: 'Ellipsis',
        },
  });

  const watchStatus = form.watch('status');
  const watchAmount = form.watch('amount');
  const watchInstallments = form.watch('installments');

  const isInstallment = initialData && initialData.installmentNumber && initialData.installmentOf;

  // Se está editando uma parcela, amount já é o valor individual
  // Se está criando, amount é o total que será dividido
  const installmentValue = initialData
    ? watchAmount || 0 // Na edição, amount já é o valor individual
    : (watchAmount || 0) / (watchInstallments || 1); // Na criação, dividir o total

  const totalAmount =
    initialData && initialData.totalAmount
      ? Number(initialData.totalAmount) // Na edição, usar o totalAmount original do banco
      : watchAmount || 0; // Na criação, amount é o total
  const hasSubsequentInstallments =
    isInstallment && initialData.installmentNumber! < initialData.installmentOf!;
  const subsequentCount = hasSubsequentInstallments
    ? initialData.installmentOf! - initialData.installmentNumber!
    : 0;

  // Detectar mudança de valor para abrir dialog de recálculo
  const handleAmountChange = (value: number) => {
    form.setValue('amount', value);

    if (
      initialData &&
      hasSubsequentInstallments &&
      value !== initialData.amount &&
      onAmountChange
    ) {
      onAmountChange(hasSubsequentInstallments, subsequentCount);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {isInstallment && (
          <div className="flex items-center gap-2 bg-secondary/50 rounded-md px-3 py-2">
            <Badge variant="secondary" className="text-sm">
              Parcela {initialData.installmentNumber}/{initialData.installmentOf}
            </Badge>
            {hasSubsequentInstallments && (
              <span className="text-xs text-muted-foreground">
                ({subsequentCount} parcela{subsequentCount > 1 ? 's' : ''} seguinte
                {subsequentCount > 1 ? 's' : ''})
              </span>
            )}
          </div>
        )}
        <div className="grid grid-cols-[auto_1fr] gap-4">
          <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <IconPicker value={field.value} onChange={field.onChange} label="Ícone *" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="supplier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fornecedor *</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do fornecedor" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Vencimento *</FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Selecione a data"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="R$ 0,00"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    disabled={field.disabled}
                    value={
                      field.value !== undefined && field.value !== null
                        ? maskCurrency(String(Math.round(field.value * 100)))
                        : ''
                    }
                    onChange={(e) => {
                      const numericValue = e.target.value.replace(/\D/g, '');
                      const value = Number(numericValue) / 100;
                      handleAmountChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(accountsPayableStatusLabel).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="installments"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parcelas *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={99}
                    placeholder="1"
                    value={field.value === undefined || field.value === null ? '' : field.value}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === '' ? '' : Number(value));
                    }}
                    disabled={!!initialData}
                  />
                </FormControl>
                {!!initialData && (
                  <p className="text-xs text-muted-foreground">
                    O número de parcelas não pode ser alterado após a criação
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Total Calculado */}
        <div className="rounded-md bg-muted p-3 space-y-2">
          {watchInstallments > 1 || isInstallment ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {initialData ? 'Valor desta parcela:' : 'Valor por parcela:'}
                </span>
                <span className="text-lg font-bold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(installmentValue)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-xs text-muted-foreground">
                  Total ({watchInstallments} parcelas):
                </span>
                <span className="text-sm font-semibold text-muted-foreground">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(totalAmount)}
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total:</span>
              <span className="text-lg font-bold">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(watchAmount || 0)}
              </span>
            </div>
          )}
        </div>

        <FormField
          control={form.control}
          name="tagIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Etiquetas (opcional)</FormLabel>
              <FormControl>
                <TagSelect
                  value={field.value || []}
                  onSelect={field.onChange}
                  scope="PAYABLES"
                  placeholder="Selecione etiquetas"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Observações sobre a conta a pagar"
                  className="resize-none"
                  rows={3}
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {watchStatus === 'PAID' && (
          <FormField
            control={form.control}
            name="paidDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Pagamento *</FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value ?? undefined}
                    onChange={field.onChange}
                    placeholder="Selecione a data do pagamento"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <CardFooter className="flex gap-2 justify-end pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : initialData ? 'Atualizar' : 'Criar'}
          </Button>
        </CardFooter>
      </form>
    </Form>
  );
}
