'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { budgetStatusSchema } from '@magic-system/schemas';
import { Archive, Copy, Package, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { DialogAction } from '@/components/dialog-action';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useDisclosure } from '@/hooks/use-disclosure';

import {
  createBudgetAction,
  updateBudgetAction,
  deleteBudgetAction,
  duplicateBudgetAction,
  archiveBudgetAction,
} from '../actions';
import { ClientSelect } from './client-select';
import { ProductSelect } from './product-select';
import { StatusSelect } from './status-select';

const formSchema = z.object({
  clientId: z.string({ message: 'Cliente é obrigatório' }).min(1, 'Cliente é obrigatório'),
  expirationDate: z.string().optional(),
  discountType: z.enum(['PERCENT', 'VALUE']).optional(),
  discountValue: z.coerce.number().optional(),
  advancePayment: z.coerce.number().optional(),
  notes: z.string().optional(),
  status: budgetStatusSchema.default('DRAFT'),
  items: z
    .array(
      z.object({
        productId: z.string(),
        name: z.string(),
        costPrice: z.number(),
        salePrice: z.number(),
        quantity: z.coerce.number().min(1),
        discountType: z.enum(['PERCENT', 'VALUE']).optional(),
        discountValue: z.coerce.number().optional(),
        total: z.number(),
      })
    )
    .min(1, 'Adicione pelo menos um produto'),
});

type FormData = z.infer<typeof formSchema>;

interface BudgetFormProps {
  initialData?: any;
}

export function BudgetForm({ initialData }: BudgetFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const deleteDialog = useDisclosure();
  const duplicateDialog = useDisclosure();
  const archiveDialog = useDisclosure();

  const isReadOnly = initialData?.status === 'SENT' || initialData?.status === 'INACTIVE';

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: initialData
      ? {
          clientId: initialData.clientId,
          expirationDate: initialData.expirationDate
            ? new Date(initialData.expirationDate).toISOString().split('T')[0]
            : '',
          discountType: initialData.discountType,
          discountValue: initialData.discountValue ? Number(initialData.discountValue) : 0,
          advancePayment: initialData.advancePayment ? Number(initialData.advancePayment) : 0,
          notes: initialData.notes,
          status: initialData.status || 'DRAFT',
          items: initialData.items.map((i: any) => ({
            productId: i.productId,
            name: i.name,
            costPrice: Number(i.costPrice),
            salePrice: Number(i.salePrice),
            quantity: i.quantity,
            discountType: i.discountType,
            discountValue: Number(i.discountValue),
            total: Number(i.total),
          })),
        }
      : {
          clientId: '',
          items: [],
          status: 'DRAFT' as const,
          discountType: 'VALUE' as const,
          discountValue: 0,
          advancePayment: 0,
        },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const items = form.watch('items');
  const globalDiscountType = form.watch('discountType');
  const globalDiscountValue = form.watch('discountValue');
  const advancePayment = form.watch('advancePayment');

  const subtotal = items.reduce((acc, item) => {
    let itemTotal = item.salePrice * item.quantity;
    if (item.discountType === 'PERCENT' && item.discountValue) {
      itemTotal -= itemTotal * (item.discountValue / 100);
    } else if (item.discountType === 'VALUE' && item.discountValue) {
      itemTotal -= item.discountValue;
    }
    return acc + itemTotal;
  }, 0);

  let total = subtotal;
  if (globalDiscountType === 'PERCENT' && globalDiscountValue) {
    total -= total * (globalDiscountValue / 100);
  } else if (globalDiscountType === 'VALUE' && globalDiscountValue) {
    total -= globalDiscountValue;
  }
  total -= advancePayment || 0;

  const onSubmit = async (data: FormData) => {
    setIsPending(true);
    try {
      if (initialData) {
        await updateBudgetAction(initialData.id, data);
        toast.success('Orçamento atualizado com sucesso');
      } else {
        await createBudgetAction(data);
        toast.success('Orçamento criado com sucesso');
      }
      router.push('/finance/budgets');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar orçamento');
      console.error(error);
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async () => {
    setIsPending(true);
    try {
      await deleteBudgetAction(initialData.id);
      toast.success('Orçamento excluído com sucesso');
      router.push('/finance/budgets');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir orçamento');
      console.error(error);
    } finally {
      setIsPending(false);
    }
  };

  const handleDuplicate = async () => {
    setIsPending(true);
    try {
      const duplicateData = {
        clientId: initialData.clientId,
        expirationDate: initialData.expirationDate,
        discountType: initialData.discountType,
        discountValue: initialData.discountValue,
        advancePayment: initialData.advancePayment,
        notes: initialData.notes,
        items: initialData.items.map((i: any) => ({
          productId: i.productId,
          name: i.name,
          costPrice: Number(i.costPrice),
          salePrice: Number(i.salePrice),
          quantity: i.quantity,
          discountType: i.discountType,
          discountValue: Number(i.discountValue),
          total: Number(i.total),
        })),
      };
      await duplicateBudgetAction(duplicateData);
      toast.success('Orçamento duplicado com sucesso');
      router.push('/finance/budgets');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao copiar orçamento');
      console.error(error);
    } finally {
      setIsPending(false);
    }
  };

  const handleAddProduct = (product: any) => {
    append({
      productId: product.id,
      name: product.title,
      costPrice: Number(product.costPrice),
      salePrice: Number(product.salePrice),
      quantity: 1,
      discountType: 'VALUE',
      discountValue: 0,
      total: Number(product.salePrice),
    });
  };

  const handleArchive = async () => {
    try {
      await archiveBudgetAction(initialData.id);
      toast.success('Orçamento arquivado com sucesso');
      router.push('/finance/budgets');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao arquivar orçamento');
      console.error(error);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-2">
      <Card className="border-none shadow-none">
        <CardContent className="p-6 space-y-4 ">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <ClientSelect
                value={form.watch('clientId')}
                onSelect={(val) => form.setValue('clientId', val)}
                error={form.formState.errors.clientId?.message}
                disabled={isReadOnly}
              />
              {form.formState.errors.clientId && (
                <span className="text-red-500 text-sm">
                  {form.formState.errors.clientId.message}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <Label>Validade</Label>
              <Controller
                control={form.control}
                name="expirationDate"
                render={({ field }) => (
                  <DatePicker
                    value={field.value ? new Date(field.value) : undefined}
                    onChange={(date) => field.onChange(date?.toISOString().split('T')[0] || '')}
                    placeholder="Selecione uma data"
                    disabled={isReadOnly}
                  />
                )}
              />
            </div>

            {initialData && (
              <div className="space-y-2">
                <Label>Status do orçamento</Label>

                <StatusSelect
                  form={form}
                  initialStatus={initialData.status}
                  isReadOnly={isReadOnly}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="m-4">
        <CardContent className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Package />
              Itens
            </h3>
            <div className="w-[300px]">
              {!isReadOnly && <ProductSelect onSelect={handleAddProduct} />}
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="w-[100px]">Qtd</TableHead>
                <TableHead className="w-[100px]">Preço</TableHead>
                <TableHead className="w-[150px]">Desconto</TableHead>
                <TableHead className="w-[100px] text-right">Total</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {fields.map((field, index) => {
                const item = items[index];
                const itemTotal =
                  item.salePrice * item.quantity -
                  (item.discountType === 'PERCENT'
                    ? (item.salePrice * item.quantity * (item.discountValue || 0)) / 100
                    : item.discountValue || 0);

                return (
                  <TableRow key={field.id}>
                    <TableCell>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Custo:{' '}
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(item.costPrice)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        {...form.register(`items.${index}.quantity`)}
                        disabled={isReadOnly}
                        className="w-[100px]"
                      />
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(item.salePrice)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Select
                          value={item.discountType || 'VALUE'}
                          onValueChange={(val) =>
                            form.setValue(`items.${index}.discountType`, val as any)
                          }
                        >
                          <SelectTrigger className="w-[70px]" disabled={isReadOnly}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="VALUE">R$</SelectItem>
                            <SelectItem value="PERCENT">%</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          step="0.01"
                          className="w-[80px]"
                          {...form.register(`items.${index}.discountValue`)}
                          disabled={isReadOnly}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(itemTotal)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        disabled={isReadOnly}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {fields.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum item adicionado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {form.formState.errors.items && (
            <span className="text-red-500 text-sm">{form.formState.errors.items.message}</span>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-none">
        <CardContent className="p-6 flex gap-4">
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold">Desconto Global</Label>
            <div className="flex gap-2">
              <Select
                value={globalDiscountType || 'VALUE'}
                onValueChange={(val) => form.setValue('discountType', val as any)}
              >
                <SelectTrigger className="w-[70px]" disabled={isReadOnly}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VALUE">R$</SelectItem>
                  <SelectItem value="PERCENT">%</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                step="0.01"
                className="w-[100px]"
                {...form.register('discountValue')}
                disabled={isReadOnly}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold">Adiantamento</Label>
            <div className="flex gap-2 items-center">
              <span className="text-sm border rounded py-2 px-4">R$</span>
              <Input
                type="number"
                step="0.01"
                className="w-[100px]"
                {...form.register('advancePayment')}
                disabled={isReadOnly}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-none">
        <CardContent className="space-y-4">
          <Label>Observações</Label>
          <Textarea
            {...form.register('notes')}
            placeholder="Observações internas ou para o cliente"
            disabled={isReadOnly}
          />
        </CardContent>
      </Card>

      <Card className="p-0 flex flex gap-2 sticky bottom-0 z-10 mt-auto border-t bg-transparent rounded-none border-none">
        <CardFooter className="flex md:flex-row flex-col w-full bg-background/35 backdrop-blur-sm py-2 px-4 gap-2 justify-between items-center border-t-[1px]">
          <div className="flex gap-1 md:gap-4 lg:gap-8 flex-col lg:flex-row self-start md:self-center">
            <div className="flex gap-2 items-center">
              <Label className="text-xs md:text-sm font-semibold">Subtotal</Label>
              <span className="text-sm md:text-lg">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  subtotal
                )}
              </span>
            </div>

            <div className="flex gap-2 items-center">
              <Label className="text-sm font-semibold">Total: </Label>
              <span className="text-lg font-semibold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  total
                )}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => duplicateDialog.open()}
              disabled={isPending}
              title="Copiar orçamento"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => archiveDialog.open()}
              disabled={isPending}
              title="Arquivar orçamento"
            >
              <Archive className="h-4 w-4" />
            </Button>

            {initialData &&
              (initialData.status === 'DRAFT' || initialData.status === 'INACTIVE') && (
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => deleteDialog.open()}
                  disabled={isPending}
                  title="Excluir orçamento"
                  className="hover:bg-destructive hover:text-white"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              )}

            {initialData?.status !== 'INACTIVE' && (
              <Button variant="outline" type="button" onClick={() => router.back()}>
                Cancelar
              </Button>
            )}

            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </CardFooter>
      </Card>

      <DialogAction
        title="Excluir orçamento"
        subtitle="Tem certeza que deseja excluir este orçamento?"
        modal={false}
        confirmButton={
          <Button variant="destructive" onClick={handleDelete}>
            <Trash className="h-4 w-4" />
            Excluir
          </Button>
        }
        open={deleteDialog.isOpen}
        onRefuse={() => deleteDialog.close()}
      />

      <DialogAction
        title="Copiar orçamento"
        subtitle="Tem certeza que deseja copiar este orçamento para um novo?"
        modal={false}
        confirmButton={
          <Button onClick={handleDuplicate}>
            <Copy className="h-4 w-4" />
            Copiar
          </Button>
        }
        open={duplicateDialog.isOpen}
        onRefuse={() => duplicateDialog.close()}
      />

      <DialogAction
        title="Arquivar orçamento"
        subtitle="Tem certeza que deseja arquivar este orçamento?"
        modal={false}
        confirmButton={
          <Button variant="destructive" onClick={handleArchive}>
            <Archive className="h-4 w-4" />
            Arquivar
          </Button>
        }
        open={archiveDialog.isOpen}
        onRefuse={() => archiveDialog.close()}
      />
    </form>
  );
}
