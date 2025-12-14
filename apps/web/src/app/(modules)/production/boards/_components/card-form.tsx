'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  ApprovedBudgetOption,
  ApprovedBudgetOptionItem,
  CardBudget,
  Template,
} from '@magic-system/schemas';
import { useCurrentEditor } from '@tiptap/react';
import {
  Archive,
  ArchiveRestore,
  ExternalLink,
  FileIcon,
  ImageIcon,
  Paperclip,
  Trash,
} from 'lucide-react';
import * as React from 'react';
import { useForm, type Path } from 'react-hook-form';
import { z } from 'zod';

import { AttachmentsManager } from '@/components/attachments-manager';
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
import { Label } from '@/components/ui/label';
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
  onArchive?: (isArchived: boolean) => void;
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
  /**
   * Estado de arquivamento do card
   */
  isArchived?: boolean;
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
  onArchive,
  submitLabel = 'Salvar',
  mode,
  cardId,
  linkedBudget,
  isArchived = false,
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
  // State to track upload status
  const [isUploading, setIsUploading] = React.useState(false);

  // State to track selected budget attachments for display in create mode
  const [selectedBudgetAttachments, setSelectedBudgetAttachments] = React.useState<
    Array<{
      id: string;
      name: string;
      url: string;
      key: string;
      size: number;
      mimeType: string | null;
    }>
  >([]);

  const attachmentsManagerRef = React.useRef<{ uploadFiles: (files: File[]) => void }>(null);

  // Handle paste event for images
  React.useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (mode !== 'edit' || !cardId) return; // Only allow in edit mode with cardId

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
            attachmentsManagerRef.current.uploadFiles([newFile]);
          }
          break; // Only handle the first image
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [mode, cardId]);

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
      setSelectedBudgetAttachments([]);
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

    // 6. Armazena os attachments do orçamento para exibição
    if (budget.attachments && budget.attachments.length > 0) {
      setSelectedBudgetAttachments(budget.attachments);
    } else {
      setSelectedBudgetAttachments([]);
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

          {/* Budget Attachments Reference Section - only in create mode when budget is selected */}
          {mode === 'create' && selectedBudgetAttachments.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Anexos do Orçamento
              </Label>
              <div className="border rounded-md p-3 bg-muted/30 space-y-2">
                <p className="text-xs text-muted-foreground mb-2">
                  Referência dos anexos do orçamento vinculado:
                </p>
                <div className="space-y-1.5">
                  {selectedBudgetAttachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-md bg-background hover:bg-accent transition-colors group"
                    >
                      {attachment.mimeType?.startsWith('image/') ? (
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <FileIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="flex-1 text-sm truncate">{attachment.name}</span>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Attachments Section - only in edit mode */}
          {mode === 'edit' && cardId && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Anexos
              </Label>
              <AttachmentsManager
                ref={attachmentsManagerRef}
                entityType="card"
                entityId={cardId}
                maxFiles={5}
                onUploadStatusChange={setIsUploading}
              />
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-2 sticky bottom-0 right-0 justify-between p-2 bg-background/35 backdrop-blur-sm border-t">
          <div className="flex gap-2">
            {onDelete && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onDelete}
                className="hover:bg-destructive hover:text-white"
                title="Excluir cartão"
                disabled={isUploading}
              >
                <Trash className="h-4 w-4" />
              </Button>
            )}
            {mode === 'edit' && onArchive && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => onArchive(!isArchived)}
                className="hover:bg-orange-500 hover:text-white"
                title={isArchived ? 'Desarquivar cartão' : 'Arquivar cartão'}
                disabled={isUploading}
              >
                {isArchived ? (
                  <ArchiveRestore className="h-4 w-4" />
                ) : (
                  <Archive className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isUploading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isUploading}>
              {submitLabel}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Form>
  );
}
