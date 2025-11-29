'use client';

import { updateCardBodySchema, type Card } from '@magic-system/schemas';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

import { updateCard } from '@/app/http/requests/boards';
import { ResponsiveDrawer } from '@/components/responsive-drawer';

import { CardForm } from '../_components/card-form';

type FormData = z.infer<typeof updateCardBodySchema>;

interface EditCardDialogProps {
  card: Card;
  children: React.ReactNode;
  onCardUpdated: (card: Card) => void;
}

export function EditCardDialog({ card, children, onCardUpdated }: EditCardDialogProps) {
  const [open, setOpen] = useState(false);

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
        className="max-w-[700px]"
      >
        <div className="p-4">
          <CardForm
            schema={updateCardBodySchema}
            defaultValues={{
              title: card.title,
              description: card.description || '',
              priority: card.priority || null,
              dueDate: card.dueDate,
              tagIds: (card as any).tags?.map((t: any) => t.id) || [],
            }}
            onSubmit={onSubmit}
            onCancel={() => setOpen(false)}
            submitLabel="Salvar"
          />
        </div>
      </ResponsiveDrawer>
    </>
  );
}
