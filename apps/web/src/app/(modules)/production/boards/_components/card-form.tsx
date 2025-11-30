'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  ApprovedBudgetOption,
  ApprovedBudgetOptionItem,
  CardBudget,
  Template,
} from '@magic-system/schemas';
import { useCurrentEditor } from '@tiptap/react';
import { Trash } from 'lucide-react';
import * as React from 'react';
import { useForm, type Path } from 'react-hook-form';
import { z } from 'zod';

import { BudgetSelect } from '@/components/budget-select';
import { TagSelect } from '@/components/tag-select';
import { TemplateSelector } from '@/components/template-selector';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
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
import { EditorProvider } from '@/components/ui/shadcn-io/editor';
import { formatPhone } from '@/lib/masks';

import { CardChecklist } from './card-checklist';
import { LinkedBudgetCard } from './linked-budget-card';

// Component to sync external content changes to the editor
function EditorContentSync({ content }: { content: string | null }) {
  const { editor } = useCurrentEditor();
  const lastSyncedContent = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (editor && content !== null && content !== lastSyncedContent.current) {
      editor.commands.setContent(content);
      lastSyncedContent.current = content;
    }
  }, [editor, content]);

  return null;
}

interface CardFormProps<T extends z.ZodType<any, any>> {
  schema: T;
  defaultValues?: z.infer<T>;
  onSubmit: (data: z.infer<T>) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => void;
  submitLabel?: string;
  /**
   * Modo do formulário: 'create' permite vincular orçamento, 'edit' exibe como readonly.
   * Se não especificado, o campo de orçamento não é exibido.
   */
  mode?: 'create' | 'edit';
  /**
   * ID do card (para operações de toggle na API em modo edit)
   */
  cardId?: string;
  /**
   * Dados do orçamento vinculado (para exibição no modo edit).
   */
  linkedBudget?: CardBudget | null;
}

interface ChecklistItemInput {
  id?: string;
  name: string;
  isCompleted: boolean;
}

export function CardForm<T extends z.ZodType<any, any>>({
  schema,
  defaultValues,
  onSubmit,
  onCancel,
  onDelete,
  submitLabel = 'Salvar',
  mode,
  cardId,
  linkedBudget,
}: CardFormProps<T>) {
  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  // State to track template content that needs to be synced to editor
  const [templateContent, setTemplateContent] = React.useState<string | null>(null);
  // State to track selected budget items for import in create mode
  const [selectedBudgetItems, setSelectedBudgetItems] = React.useState<ApprovedBudgetOptionItem[]>(
    []
  );

  const handleTemplateSelect = (template: Template, fieldOnChange: (value: string) => void) => {
    setTemplateContent(template.content);
    fieldOnChange(template.content);
  };

  /**
   * Handler para quando um orçamento é selecionado.
   * Preenche automaticamente o título com o telefone do cliente,
   * a descrição com as observações do orçamento,
   * e importa as tags do orçamento (exceto BUDGET scope).
   */
  const handleBudgetSelect = (budget: ApprovedBudgetOption | null) => {
    if (!budget) {
      form.setValue('budgetId' as Path<z.infer<T>>, null as any);
      return;
    }

    // 1. Define o ID do orçamento no form
    form.setValue('budgetId' as Path<z.infer<T>>, budget.id as any);

    // 2. Define o Título como o Telefone do Cliente
    // Fallback: Se não tiver telefone, usa o nome para não deixar vazio
    const cardTitle = formatPhone(budget.client.phone) || budget.client.name;
    form.setValue('title' as Path<z.infer<T>>, cardTitle as any);

    // 3. Define a Descrição com as observações do orçamento
    if (budget.notes) {
      form.setValue('description' as Path<z.infer<T>>, budget.notes as any);
      // Atualiza o estado do template para sincronizar com o editor
      setTemplateContent(budget.notes);
    }

    // 4. Lógica de Tags - Filtra tags que não são exclusivas de orçamento
    const currentTags = (form.getValues('tagIds' as Path<z.infer<T>>) || []) as string[];

    // Filtra tags que não são exclusivas de orçamento (BUDGET scope)
    const validBudgetTags = budget.tags.filter((tag) => tag.scope !== 'BUDGET');

    // Combina tags existentes com as novas, removendo duplicatas por ID
    const mergedTagIds = [...currentTags, ...validBudgetTags.map((t) => t.id)];
    const uniqueTagIds = Array.from(new Set(mergedTagIds));

    form.setValue('tagIds' as Path<z.infer<T>>, uniqueTagIds as any);

    // 5. Armazena os itens do orçamento para uso posterior no checklist
    if (budget.items && budget.items.length > 0) {
      setSelectedBudgetItems(budget.items);
    } else {
      setSelectedBudgetItems([]);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="elative ">
        <CardContent className="space-y-4 p-4">
          {mode === 'create' && (
            <FormField
              control={form.control}
              name={'budgetId' as Path<z.infer<T>>}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vincular Orçamento (Opcional)</FormLabel>
                  <FormControl>
                    <BudgetSelect
                      value={field.value}
                      onSelect={handleBudgetSelect}
                      placeholder="Selecione um orçamento aprovado..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Exibe o orçamento vinculado em modo readonly no edit */}
          {mode === 'edit' && linkedBudget && <LinkedBudgetCard budget={linkedBudget} />}

          <FormField
            control={form.control}
            name={'title' as Path<z.infer<T>>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Arte do Cartão de Visita" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={'description' as Path<z.infer<T>>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <TemplateSelector
                  scope="BOARD"
                  onSelect={(template: Template) => handleTemplateSelect(template, field.onChange)}
                />
                <FormControl>
                  <EditorProvider
                    content={field.value || ''}
                    onUpdate={({ editor }) => field.onChange(editor.getHTML())}
                    placeholder="Detalhes da tarefa..."
                    className="min-h-[150px] border rounded-md"
                  >
                    <EditorContentSync content={templateContent} />
                  </EditorProvider>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name={'dueDate' as Path<z.infer<T>>}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Vencimento</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value ? new Date(field.value) : undefined}
                      onChange={(date) => {
                        field.onChange(date ? date.toISOString() : undefined);
                      }}
                      placeholder="Selecione uma data"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={'priority' as Path<z.infer<T>>}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridade</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === 'null' ? null : value)}
                    value={field.value || 'null'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a prioridade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="null">Sem prioridade</SelectItem>
                      <SelectItem value="LOW">Baixa</SelectItem>
                      <SelectItem value="MEDIUM">Média</SelectItem>
                      <SelectItem value="HIGH">Alta</SelectItem>
                      <SelectItem value="URGENT">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name={'tagIds' as Path<z.infer<T>>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Etiquetas</FormLabel>
                <FormControl>
                  <TagSelect value={field.value || []} onSelect={field.onChange} scope="BOARD" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Checklist Section */}
          <FormField
            control={form.control}
            name={'checklistItems' as Path<z.infer<T>>}
            render={({ field }) => {
              // Determina os itens do orçamento para importação
              // Em modo create, usa o orçamento selecionado via state
              // Em modo edit, usa o linkedBudget passado como prop
              const budgetItems = mode === 'edit' ? linkedBudget?.items : selectedBudgetItems;

              return (
                <FormItem>
                  <FormControl>
                    <CardChecklist
                      cardId={cardId}
                      items={(field.value as ChecklistItemInput[]) || []}
                      onChange={field.onChange}
                      budgetItems={budgetItems}
                      isEditMode={mode === 'edit'}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </CardContent>

        <CardFooter className="flex gap-2 sticky bottom-0 right-0 justify-end p-2 bg-background/35 backdrop-blur-sm border-t">
          {onDelete && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onDelete}
              className="hover:bg-destructive hover:text-white"
              title="Excluir cartão"
            >
              <Trash className="h-4 w-4" />
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">{submitLabel}</Button>
        </CardFooter>
      </form>
    </Form>
  );
}
