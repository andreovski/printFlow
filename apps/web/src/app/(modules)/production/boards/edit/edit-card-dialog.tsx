'use client';

import { updateCardBodySchema, type Card } from '@magic-system/schemas';
import { Trash } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

import { deleteCard, updateCard } from '@/app/http/requests/boards';
import { DialogAction } from '@/components/dialog-action';
import { ResponsiveDrawer } from '@/components/responsive-drawer';
import { Button } from '@/components/ui/button';
import { useDisclosure } from '@/hooks/use-disclosure';

import { CardForm } from '../_components/card-form';

type FormData = z.infer<typeof updateCardBodySchema>;

interface EditCardDialogProps {
  card: Card;
  children: React.ReactNode;
  onCardUpdated: (card: Card) => void;
  onCardDeleted?: (cardId: string) => void;
}

export function EditCardDialog({
  card,
  children,
  onCardUpdated,
  onCardDeleted,
}: EditCardDialogProps) {
  const [open, setOpen] = useState(false);
  const deleteDialog = useDisclosure();

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

  const handleDelete = async () => {
    try {
      await deleteCard(card.id);
      toast.success('Cartão excluído com sucesso');
      deleteDialog.close();
      setOpen(false);
      onCardDeleted?.(card.id);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir cartão');
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
          onDelete={() => deleteDialog.open()}
          submitLabel="Salvar"
          mode="edit"
          linkedBudget={(card as any).budget || null}
        />
      </ResponsiveDrawer>

      <DialogAction
        title="Excluir cartão"
        subtitle="Tem certeza que deseja excluir este cartão? Esta ação não pode ser desfeita."
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
    </>
  );
}
