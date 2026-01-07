'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  createAccountsPayableSchema,
  updateAccountsPayableSchema,
  AccountsPayable,
  accountsPayableStatusLabel,
} from '@magic-system/schemas';
import { Info, Repeat } from 'lucide-react';
import { useForm, Resolver } from 'react-hook-form';
import { z } from 'zod';

import { IconPicker } from '@/components/icon-picker';
import { TagSelect } from '@/components/tag-select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Form,
  FormControl,
  FormDescription,
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

// Use the create schema as the base FormData type since it includes all fields
// The update schema is a subset, so we cast it appropriately in the form
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
    // Cast through unknown because update schema has installments as optional
    // while create schema has it as required. Both produce compatible data at runtime.
    resolver: zodResolver(schema) as Resolver<FormData>,
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
          isRecurring: initialData.isRecurring || false,
        }
      : {
          status: 'PENDING' as const,
          installments: 1,
          tagIds: [],
          icon: 'Ellipsis',
          isRecurring: false,
        },
  });

  const watchStatus = form.watch('status');
  const watchAmount = form.watch('amount');
  const watchInstallments = form.watch('installments');
  const watchIsRecurring = form.watch('isRecurring');

  const isInstallment = initialData && initialData.installmentNumber && initialData.installmentOf;
  const isRecurringAccount = initialData && initialData.isRecurring;

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
                      const numericValue = e.target.value.replaceAll(/\D/g, '');
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
                      // Se mudar para > 1, desmarcar recorrência
                      if (Number(value) > 1) {
                        form.setValue('isRecurring', false);
                      }
                    }}
                    disabled={!!initialData || watchIsRecurring}
                  />
                </FormControl>
                {watchIsRecurring && !initialData && (
                  <FormDescription className="text-xs text-muted-foreground">
                    Desativado ao selecionar recorrência
                  </FormDescription>
                )}
                {!!initialData && (
                  <FormDescription className="text-xs text-muted-foreground">
                    O número de parcelas não pode ser alterado após a criação
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Checkbox de Recorrência - Apenas na criação */}
        {!initialData && (
          <FormField
            control={form.control}
            name="isRecurring"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      // Se marcar recorrência, resetar parcelas para 1
                      if (checked) {
                        form.setValue('installments', 1);
                      }
                    }}
                    disabled={watchInstallments > 1}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="flex items-center gap-2">
                    <Repeat className="h-4 w-4" />
                    Conta Recorrente (mensal)
                  </FormLabel>
                  <FormDescription>
                    {watchInstallments > 1 ? (
                      <span className="text-warning">
                        Não é possível combinar recorrência com parcelamento
                      </span>
                    ) : field.value ? (
                      <span className="font-medium text-primary">
                        Criará 60 contas mensais automaticamente em segundo plano
                      </span>
                    ) : (
                      'Marque para criar uma conta que se repete todo mês (até 60 meses)'
                    )}
                  </FormDescription>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        )}

        {/* Badge de status de recorrência na edição */}
        {isRecurringAccount && (
          <Alert>
            <Repeat className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Conta Recorrente</p>
                  <p className="text-sm text-muted-foreground">
                    Esta é uma conta recorrente (posição {initialData.recurringPosition}/60)
                  </p>
                </div>
                {initialData.creationJobStatus === 'PROCESSING' && (
                  <Badge variant="secondary">Processando...</Badge>
                )}
                {initialData.creationJobStatus === 'COMPLETED' && (
                  <Badge variant="default">Concluído</Badge>
                )}
                {initialData.creationJobStatus === 'FAILED' && (
                  <Badge variant="destructive">Falhou</Badge>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Total Calculado */}
        <div className="rounded-md bg-muted p-3 space-y-2">
          {watchIsRecurring && !initialData ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Repeat className="h-4 w-4" />
                  Valor mensal:
                </span>
                <span className="text-lg font-bold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(watchAmount || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-xs text-muted-foreground">Total acumulado (60 meses):</span>
                <span className="text-sm font-semibold text-muted-foreground">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format((watchAmount || 0) * 60)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                <Info className="h-3 w-3" />
                <span>As contas serão criadas automaticamente após salvar</span>
              </div>
            </>
          ) : watchInstallments > 1 || isInstallment ? (
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
