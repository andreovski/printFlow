'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  budgetStatusSchema,
  paymentTypeSchema,
  paymentTypeLabel,
  Template,
} from '@magic-system/schemas';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentEditor } from '@tiptap/react';
import { Archive, Copy, Package, Paperclip, Printer, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { AttachmentsManager } from '@/components/attachments-manager';
import { DialogAction } from '@/components/dialog-action';
import { TagSelect } from '@/components/tag-select';
import { TemplateSelector } from '@/components/template-selector';
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
import { EditorProvider } from '@/components/ui/shadcn-io/editor';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAppContext } from '@/hooks/use-app-context';
import { useDisclosure } from '@/hooks/use-disclosure';

import {
  createBudgetAction,
  updateBudgetAction,
  deleteBudgetAction,
  duplicateBudgetAction,
  archiveBudgetAction,
} from '../actions';
import { ClientSelect } from './client-select';
import { GenerateLinkButton } from './generate-link-button';
import { ProductSelect } from './product-select';
import { StatusSelect } from './status-select';

// Component to sync external content changes to the editor
function EditorContentSync({ content }: { content: string | null }) {
  const { editor } = useCurrentEditor();
  const lastSyncedContent = useRef<string | null>(null);

  useEffect(() => {
    if (editor && content !== null && content !== lastSyncedContent.current) {
      editor.commands.setContent(content);
      lastSyncedContent.current = content;
    }
  }, [editor, content]);

  return null;
}

const formSchema = z.object({
  clientId: z.string({ message: 'Cliente é obrigatório' }).min(1, 'Cliente é obrigatório'),
  expirationDate: z.string().optional(),
  discountType: z.enum(['PERCENT', 'VALUE']).optional(),
  discountValue: z.coerce.number().optional(),
  surchargeType: z.enum(['PERCENT', 'VALUE']).optional(),
  surchargeValue: z.coerce.number().optional(),
  advancePayment: z.coerce.number().optional(),
  paymentType: paymentTypeSchema.optional(),
  notes: z.string().nullish(),
  status: budgetStatusSchema.default('DRAFT'),
  tagIds: z.array(z.string()).optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        name: z.string(),
        costPrice: z.number(),
        salePrice: z.number(),
        unitType: z.enum(['M2', 'UNIDADE']).optional().nullable(),
        width: z.coerce.number().optional().nullable(),
        height: z.coerce.number().optional().nullable(),
        quantity: z.coerce.number().min(0.01),
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
  onSuccess?: () => void;
}

export function BudgetForm({ initialData, onSuccess }: BudgetFormProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { user } = useAppContext();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MASTER';
  const [isPending, setIsPending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const deleteDialog = useDisclosure();
  const duplicateDialog = useDisclosure();
  const archiveDialog = useDisclosure();

  // State to track template content that needs to be synced to editor
  const [templateContent, setTemplateContent] = useState<string | null>(null);

  const handleTemplateSelect = (template: Template) => {
    setTemplateContent(template.content);
    form.setValue('notes', template.content);
  };

  const attachmentsManagerRef = useRef<{ uploadFiles: (files: File[]) => void }>(null);

  const isReadOnly = initialData?.status === 'SENT' || initialData?.status === 'INACTIVE';

  // Handle paste event for images
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (isReadOnly || !initialData) return; // Only allow for existing budgets and not readonly

      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          event.preventDefault();
          const file = item.getAsFile();
          if (file && attachmentsManagerRef.current) {
            // Generate a name for the pasted image
            const timestamp = Date.now();
            const mimeType = item.type || 'image/png'; // Fallback to png if type is not available
            const extension = mimeType.split('/')[1] || 'png';
            const newFile = new File([file], `pasted-image-${timestamp}.${extension}`, {
              type: mimeType,
            });
            // We can't easily track upload status from paste here without exposing another method or state from AttachmentsManager
            // But AttachmentsManager will update isUploading via the prop we are about to add.
            attachmentsManagerRef.current.uploadFiles([newFile]);
          }
          break; // Only handle the first image
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isReadOnly, initialData]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: initialData
      ? {
          clientId: initialData.clientId,
          expirationDate: initialData.expirationDate
            ? new Date(initialData.expirationDate).toISOString().split('T')[0]
            : '',
          discountType: initialData.discountType || 'VALUE',
          discountValue: initialData.discountValue ? Number(initialData.discountValue) : 0,
          surchargeType: initialData.surchargeType || 'VALUE',
          surchargeValue: initialData.surchargeValue ? Number(initialData.surchargeValue) : 0,
          advancePayment: initialData.advancePayment ? Number(initialData.advancePayment) : 0,
          paymentType: initialData.paymentType || undefined,
          notes: initialData.notes,
          status: initialData.status || 'DRAFT',
          tagIds: initialData.tags?.map((t: any) => t.id) || [],
          items: initialData.items.map((i: any) => ({
            productId: i.productId,
            name: i.name,
            costPrice: Number(i.costPrice),
            salePrice: Number(i.salePrice),
            unitType: i.unitType || null,
            width: i.width ? Number(i.width) : null,
            height: i.height ? Number(i.height) : null,
            quantity: i.quantity,
            discountType: i.discountType,
            discountValue: Number(i.discountValue),
            total: Number(i.total),
          })),
        }
      : {
          clientId: '',
          items: [],
          status: 'DRAFT',
          discountType: 'VALUE',
          discountValue: 0,
          surchargeType: 'VALUE',
          surchargeValue: 0,
          advancePayment: 0,
          paymentType: undefined,
          tagIds: [],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const items = form.watch('items');
  const globalDiscountType = form.watch('discountType');
  const globalDiscountValue = form.watch('discountValue');
  const globalSurchargeType = form.watch('surchargeType');
  const globalSurchargeValue = form.watch('surchargeValue');
  const advancePayment = form.watch('advancePayment');

  // Soma dos itens com descontos individuais
  const itemsTotal = items.reduce((acc, item) => {
    // Calcular total com base no tipo de unidade
    let baseValue: number;
    if (item.unitType === 'M2' && item.width && item.height) {
      const area = Number(item.width) * Number(item.height); // width e height em metros
      baseValue = area * (item.salePrice * item.quantity);
    } else {
      baseValue = item.salePrice * item.quantity;
    }

    let itemTotal = baseValue;
    if (item.discountType === 'PERCENT' && item.discountValue) {
      itemTotal -= itemTotal * (item.discountValue / 100);
    } else if (item.discountType === 'VALUE' && item.discountValue) {
      itemTotal -= item.discountValue;
    }
    return acc + itemTotal;
  }, 0);

  // Subtotal = itens com descontos individuais + acréscimo global - desconto global
  let subtotal = itemsTotal;
  // Aplicar acréscimo global primeiro
  const surchargeVal = Number(globalSurchargeValue) || 0;
  const surchargeType = globalSurchargeType || 'VALUE'; // Default to VALUE if not set
  if (surchargeType === 'PERCENT' && surchargeVal) {
    subtotal += subtotal * (surchargeVal / 100);
  } else if (surchargeVal) {
    // VALUE type or default
    subtotal += surchargeVal;
  }
  // Aplicar desconto global
  const discountVal = Number(globalDiscountValue) || 0;
  const discountType = globalDiscountType || 'VALUE'; // Default to VALUE if not set
  if (discountType === 'PERCENT' && discountVal) {
    subtotal -= subtotal * (discountVal / 100);
  } else if (discountVal) {
    // VALUE type or default
    subtotal -= discountVal;
  }

  // Total = subtotal - adiantamento
  const total = subtotal - (advancePayment || 0);

  const onSubmit = async (data: FormData) => {
    setIsPending(true);
    try {
      if (initialData) {
        await updateBudgetAction(initialData.id, data);
        toast.success('Orçamento atualizado com sucesso');

        if (initialData.status !== 'ACCEPTED' && data.status === 'ACCEPTED') {
          queryClient.invalidateQueries({
            queryKey: ['sales-movement'],
          });
        }
      } else {
        await createBudgetAction(data);
        toast.success('Orçamento criado com sucesso');
      }
      if (onSuccess) {
        onSuccess();
      } else {
        router.back();
      }
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

      if (initialData.status === 'ACCEPTED') {
        queryClient.invalidateQueries({
          queryKey: ['sales-movement'],
        });
      }

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
        surchargeType: initialData.surchargeType,
        surchargeValue: initialData.surchargeValue,
        advancePayment: initialData.advancePayment,
        notes: initialData.notes || '',
        tagIds: initialData.tags?.map((t: any) => t.id) || [],
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
      router.back();
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
      unitType: product.unitType || null,
      width: null,
      height: null,
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
      router.back();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao arquivar orçamento');
      console.error(error);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-2">
      <Card className="border-none shadow-none">
        <CardContent className="p-6 space-y-4 ">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-center">
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
                    onChange={(date) => field.onChange(date ? date?.toISOString() : undefined)}
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

            <div className="flex flex-col space-y-2 min-w-[250px]">
              <Label className="text-xs font-semibold">Etiquetas</Label>
              <TagSelect
                value={form.watch('tagIds') || []}
                onSelect={(tagIds) => form.setValue('tagIds', tagIds)}
                scope="BUDGET"
                disabled={isReadOnly}
                placeholder="Selecione etiquetas..."
              />
            </div>
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
                <TableHead className="w-[180px]">Metragem</TableHead>
                <TableHead className="w-[100px]">Preço</TableHead>
                <TableHead className="w-[150px]">Desconto</TableHead>
                <TableHead className="w-[100px] text-right">Total</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {fields.map((field, index) => {
                const item = items[index];

                // Calcular total com base no tipo de unidade
                let baseValue: number;
                if (item.unitType === 'M2' && item.width && item.height) {
                  const area = Number(item.width) * Number(item.height); // width e height em metros
                  baseValue = area * (item.salePrice * item.quantity);
                } else {
                  baseValue = item.salePrice * item.quantity;
                }

                const itemTotal =
                  baseValue -
                  (item.discountType === 'PERCENT'
                    ? (baseValue * (item.discountValue || 0)) / 100
                    : item.discountValue || 0);

                return (
                  <TableRow key={field.id}>
                    <TableCell>
                      <div className="font-medium">{item.name}</div>
                      {isAdmin && (
                        <div className="text-xs text-muted-foreground">
                          Custo:{' '}
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(item.costPrice)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        {...form.register(`items.${index}.quantity`)}
                        disabled={isReadOnly}
                        className="w-[100px]"
                      />
                    </TableCell>
                    <TableCell>
                      {item.unitType === 'M2' ? (
                        <div className="flex gap-1 items-center">
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="L (m)"
                            {...form.register(`items.${index}.width`)}
                            disabled={isReadOnly}
                            className="w-[65px]"
                          />
                          <span className="text-muted-foreground">×</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="A (m)"
                            {...form.register(`items.${index}.height`)}
                            disabled={isReadOnly}
                            className="w-[65px]"
                          />
                          {item.width && item.height && (
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              = {(Number(item.width) * Number(item.height)).toFixed(2)}m²
                            </span>
                          )}
                        </div>
                      ) : null}
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
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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
        <CardContent className="p-6 flex flex-wrap gap-4">
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
            <Label className="text-xs font-semibold">Acréscimo Global</Label>
            <div className="flex gap-2">
              <Select
                value={globalSurchargeType || 'VALUE'}
                onValueChange={(val) => form.setValue('surchargeType', val as any)}
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
                {...form.register('surchargeValue')}
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

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold">Forma de Pagamento</Label>
            <Select
              value={form.watch('paymentType') || ''}
              onValueChange={(val) => form.setValue('paymentType', val as any)}
            >
              <SelectTrigger className="w-[180px]" disabled={isReadOnly}>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(paymentTypeLabel) as [string, string][]).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-none">
        <CardContent className="space-y-4">
          <Label>Observações</Label>
          {!isReadOnly && <TemplateSelector scope="BUDGET" onSelect={handleTemplateSelect} />}
          <Controller
            control={form.control}
            name="notes"
            render={({ field }) => (
              <EditorProvider
                content={field.value || ''}
                onUpdate={({ editor }) => field.onChange(editor.getHTML())}
                placeholder="Observações internas ou para o cliente"
                className="min-h-[150px] border rounded-md p-4"
                editable={!isReadOnly}
              >
                <EditorContentSync content={templateContent} />
              </EditorProvider>
            )}
          />
        </CardContent>
      </Card>

      {/* Seção de Anexos - apenas para orçamentos existentes */}
      {initialData && (
        <Card className="border-none shadow-none">
          <CardContent className="space-y-4">
            <Label className="flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Anexos
            </Label>
            <AttachmentsManager
              ref={attachmentsManagerRef}
              entityType="budget"
              entityId={initialData.id}
              disabled={isReadOnly}
              maxFiles={5}
              onUploadStatusChange={setIsUploading}
            />
          </CardContent>
        </Card>
      )}

      <Card className="p-0 flex gap-2 sticky bottom-0 z-10 mt-auto border-t bg-transparent rounded-none border-none">
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
            {['ACCEPTED'].includes(initialData?.status) && (
              <Button
                variant="outline"
                type="button"
                onClick={() => window.open(`/receipt/${initialData.id}`, '_blank')}
                disabled={isPending || isUploading}
                title="Imprimir Recibo"
              >
                <Printer className="h-4 w-4" />
              </Button>
            )}
            {initialData?.status === 'SENT' && (
              <GenerateLinkButton
                budgetId={initialData.id}
                existingToken={initialData.approvalToken}
                expirationDate={
                  initialData.expirationDate ? new Date(initialData.expirationDate) : null
                }
              />
            )}
            {initialData && (
              <Button
                variant="outline"
                type="button"
                onClick={() => duplicateDialog.open()}
                disabled={isPending || isUploading}
                title="Copiar orçamento"
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
            {initialData && (
              <Button
                variant="outline"
                type="button"
                onClick={() => archiveDialog.open()}
                disabled={isPending || isUploading}
                title="Arquivar orçamento"
              >
                <Archive className="h-4 w-4" />
              </Button>
            )}

            {initialData &&
              (initialData.status === 'DRAFT' || initialData.status === 'INACTIVE') && (
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => deleteDialog.open()}
                  disabled={isPending || isUploading}
                  title="Excluir orçamento"
                  className="hover:bg-destructive hover:text-white"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              )}

            <Button type="submit" disabled={isPending || isUploading}>
              {isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </CardFooter>
      </Card>

      <DialogAction
        title="Excluir orçamento"
        subtitle="Tem certeza que deseja excluir este orçamento?"
        modal={false}
        disabled={isUploading}
        confirmButton={
          <Button variant="destructive" onClick={handleDelete} disabled={isUploading}>
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
        disabled={isUploading}
        confirmButton={
          <Button onClick={handleDuplicate} disabled={isUploading}>
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
        disabled={isUploading}
        confirmButton={
          <Button variant="destructive" onClick={handleArchive} disabled={isUploading}>
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
