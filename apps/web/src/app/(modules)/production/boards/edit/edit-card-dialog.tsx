'use client';

import { updateCardBodySchema, type Card } from '@magic-system/schemas';
import { Trash } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

import { useArchiveCard, useDeleteCard, useUpdateCard } from '@/app/http/hooks/use-boards';
import { DialogAction } from '@/components/dialog-action';
import { ResponsiveDrawer } from '@/components/responsive-drawer';
import { Button } from '@/components/ui/button';
import { useDisclosure } from '@/hooks/use-disclosure';

import { CardForm } from '../_components/card-form';
import { TransferCardDialog } from '../_components/transfer-card-dialog';

type FormData = z.infer<typeof updateCardBodySchema>;

interface EditCardDialogProps {
  card: Card;
  boardId: string;
  columnId: string;
  children?: React.ReactNode;
  onCardUpdated: (card: Card) => void;
  onCardDeleted?: (cardId: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EditCardDialog({
  card,
  boardId,
  columnId,
  children,
  onCardUpdated,
  onCardDeleted,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: EditCardDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;
  const [transferOpen, setTransferOpen] = useState(false);
  const deleteDialog = useDisclosure();
  const updateCardMutation = useUpdateCard();
  const deleteCardMutation = useDeleteCard();
  const archiveCardMutation = useArchiveCard();

  const onSubmit = async (data: FormData) => {
    try {
      const updatedCard = await updateCardMutation.mutateAsync({ id: card.id, data });
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
      await deleteCardMutation.mutateAsync(card.id);
      toast.success('Cartão excluído com sucesso');
      deleteDialog.close();
      setOpen(false);
      onCardDeleted?.(card.id);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir cartão');
    }
  };

  const handleArchive = async (isArchived: boolean) => {
    try {
      await archiveCardMutation.mutateAsync({ id: card.id, isArchived });
      toast.success(
        isArchived ? 'Cartão arquivado com sucesso' : 'Cartão desarquivado com sucesso'
      );
      setOpen(false);
      // Query invalidation will automatically update the UI
    } catch (error) {
      console.error(error);
      toast.error('Erro ao arquivar cartão');
    }
  };

  const handleTransferClick = () => {
    setTransferOpen(true);
  };

  const handleTransferComplete = () => {
    setOpen(false);
  };

  return (
    <>
      {children && (
        <div onClick={() => setOpen(true)} className="cursor-pointer">
          {children}
        </div>
      )}

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
            checklistItems: (card as any).checklistItems || [],
          }}
          onSubmit={onSubmit}
          onCancel={() => setOpen(false)}
          onDelete={() => deleteDialog.open()}
          onArchive={handleArchive}
          onTransfer={handleTransferClick}
          submitLabel="Salvar"
          mode="edit"
          cardId={card.id}
          boardId={boardId}
          linkedBudget={(card as any).budget || null}
          isArchived={card.isArchived}
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

      <TransferCardDialog
        cardId={card.id}
        currentBoardId={boardId}
        currentColumnId={columnId}
        cardTitle={card.title}
        isArchived={card.isArchived}
        open={transferOpen}
        onOpenChange={setTransferOpen}
        onTransferComplete={handleTransferComplete}
      />
    </>
  );
}
