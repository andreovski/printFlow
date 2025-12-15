'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { createBoardBodySchema, type Board } from '@magic-system/schemas';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useCreateBoard } from '@/app/http/hooks/use-boards';
import { ResponsiveDrawer } from '@/components/responsive-drawer';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';

type FormData = z.infer<typeof createBoardBodySchema>;

interface CreateBoardDialogProps {
  children: React.ReactNode;
  onBoardCreated: (board: Board) => void;
}

export function CreateBoardDialog({ children, onBoardCreated }: CreateBoardDialogProps) {
  const [open, setOpen] = useState(false);
  const createBoardMutation = useCreateBoard();

  const form = useForm<FormData, any, FormData>({
    resolver: zodResolver(createBoardBodySchema) as any,
    defaultValues: {
      title: '',
      description: '',
      columns: [{ title: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'columns',
  });

  const onSubmit = async (data: FormData) => {
    try {
      const newBoard = await createBoardMutation.mutateAsync(data);
      toast.success('Quadro criado com sucesso');
      onBoardCreated(newBoard);
      setOpen(false);
      form.reset({
        title: '',
        description: '',
        columns: [{ title: '' }],
      });
    } catch (error) {
      console.error(error);
      toast.error('Erro ao criar quadro');
    }
  };

  const handleQuickAddColumns = () => {
    const defaultColumns = [{ title: 'A Fazer' }, { title: 'Em Andamento' }, { title: 'Feito' }];
    defaultColumns.forEach((col) => append(col));
  };

  return (
    <>
      <div onClick={() => setOpen(true)}>{children}</div>

      <ResponsiveDrawer
        open={open}
        onOpenChange={setOpen}
        title="Novo Quadro"
        description="Crie um novo quadro de produção com colunas personalizadas."
      >
        <div className="p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Produção Geral" {...field} />
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
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva o propósito deste quadro..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Colunas *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleQuickAddColumns}
                    className="h-8 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar padrões
                  </Button>
                </div>

                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <FormField
                      key={field.id}
                      control={form.control}
                      name={`columns.${index}.title`}
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input
                                placeholder={`${index === 0 ? 'A Fazer' : `Nome da coluna ${index + 1}`}`}
                                {...field}
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(index)}
                              disabled={fields.length === 1}
                              className="h-10 w-10 shrink-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ title: '' })}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar coluna
                </Button>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    form.reset({
                      title: '',
                      description: '',
                      columns: [{ title: '' }],
                    });
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createBoardMutation.isPending}>
                  {createBoardMutation.isPending ? 'Criando...' : 'Criar Quadro'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </ResponsiveDrawer>
    </>
  );
}
