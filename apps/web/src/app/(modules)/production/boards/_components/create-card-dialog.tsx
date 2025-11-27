'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { createCardBodySchema, type Card } from '@magic-system/schemas';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { createCard } from '@/app/http/requests/boards';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type FormData = z.infer<typeof createCardBodySchema>;

interface CreateCardDialogProps {
  columnId: string;
  children: React.ReactNode;
  onCardCreated: (card: Card) => void;
}

export function CreateCardDialog({ columnId, children, onCardCreated }: CreateCardDialogProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<FormData, any, FormData>({
    resolver: zodResolver(createCardBodySchema) as any,
    defaultValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const newCard = await createCard(columnId, data);
      toast.success('Cartão criado com sucesso');
      onCardCreated(newCard);
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao criar cartão');
    }
  };

  return (
    <>
      <div onClick={() => setOpen(true)}>{children}</div>

      <ResponsiveDrawer
        open={open}
        onOpenChange={setOpen}
        title="Novo Cartão"
        description="Crie um novo cartão para esta coluna."
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
                      <Input placeholder="Ex: Arte do Cartão de Visita" {...field} />
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
                      <Textarea placeholder="Detalhes da tarefa..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a prioridade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
