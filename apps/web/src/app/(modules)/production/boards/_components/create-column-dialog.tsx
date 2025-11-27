'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { createColumnBodySchema, type BoardColumn } from '@magic-system/schemas';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { createColumn } from '@/app/http/requests/boards';
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

// We need to omit boardId from the form because it's passed as a prop
const formSchema = createColumnBodySchema.omit({ boardId: true });
type FormData = z.infer<typeof formSchema>;

interface CreateColumnDialogProps {
  boardId: string;
  children: React.ReactNode;
  onColumnCreated: (column: BoardColumn) => void;
}

export function CreateColumnDialog({
  boardId,
  children,
  onColumnCreated,
}: CreateColumnDialogProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<FormData, any, FormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      title: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const newColumn = await createColumn({ ...data, boardId });
      toast.success('Coluna criada com sucesso');
      onColumnCreated(newColumn);
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao criar coluna');
    }
  };

  return (
    <>
      <div onClick={() => setOpen(true)}>{children}</div>

      <ResponsiveDrawer
        open={open}
        onOpenChange={setOpen}
        title="Nova Coluna"
        description="Crie uma nova coluna para este quadro."
      >
        <div className="p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Em Revisão" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Criar</Button>
              </div>
            </form>
          </Form>
        </div>
      </ResponsiveDrawer>
    </>
  );
}
