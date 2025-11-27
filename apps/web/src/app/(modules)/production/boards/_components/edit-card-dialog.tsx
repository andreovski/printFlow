'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { updateCardBodySchema, type Card } from '@magic-system/schemas';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { updateCard } from '@/app/http/requests/boards';
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

type FormData = z.infer<typeof updateCardBodySchema>;

interface EditCardDialogProps {
  card: Card;
  children: React.ReactNode;
  onCardUpdated: (card: Card) => void;
}

export function EditCardDialog({ card, children, onCardUpdated }: EditCardDialogProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<FormData, any, FormData>({
    resolver: zodResolver(updateCardBodySchema) as any,
    defaultValues: {
      title: card.title,
      description: card.description || '',
      priority: card.priority,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const updatedCard = await updateCard(card.id, data);
      toast.success('Cartão atualizado com sucesso');
      onCardUpdated(updatedCard);
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar cartão');
    }
  };

  return (
    <>
      <div onClick={() => setOpen(true)} className="cursor-pointer">
        {children}
      </div>

      <ResponsiveDrawer
        open={open}
        onOpenChange={setOpen}
        title="Editar Cartão"
        description="Edite os detalhes do cartão."
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
                <Button type="submit">Salvar</Button>
              </div>
            </form>
          </Form>
        </div>
      </ResponsiveDrawer>
    </>
  );
}
