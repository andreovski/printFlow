'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Template } from '@magic-system/schemas';
import { useCurrentEditor } from '@tiptap/react';
import * as React from 'react';
import { useForm, type Path } from 'react-hook-form';
import { z } from 'zod';

import { TagSelect } from '@/components/tag-select';
import { TemplateSelector } from '@/components/template-selector';
import { Button } from '@/components/ui/button';
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
  submitLabel?: string;
}

export function CardForm<T extends z.ZodType<any, any>>({
  schema,
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = 'Salvar',
}: CardFormProps<T>) {
  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  // State to track template content that needs to be synced to editor
  const [templateContent, setTemplateContent] = React.useState<string | null>(null);

  const handleTemplateSelect = (template: Template, fieldOnChange: (value: string) => void) => {
    setTemplateContent(template.content);
    fieldOnChange(template.content);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

        <div className="flex gap-2 justify-end pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">{submitLabel}</Button>
        </div>
      </form>
    </Form>
  );
}
