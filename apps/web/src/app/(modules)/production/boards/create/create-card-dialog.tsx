'use client';

import { createCardBodySchema, type Card } from '@magic-system/schemas';
import { toast } from 'sonner';
import { z } from 'zod';

import { createCard } from '@/app/http/requests/boards';
import { ResponsiveDrawer } from '@/components/responsive-drawer';
import { useDisclosure } from '@/hooks/use-disclosure';

import { CardForm } from '../_components/card-form';

type FormData = z.infer<typeof createCardBodySchema>;

interface CreateCardDialogProps {
  columnId: string;
  children: React.ReactNode;
  onCardCreated: (card: Card) => void;
}

export function CreateCardDialog({ columnId, children, onCardCreated }: CreateCardDialogProps) {
  const { isOpen: open, toggle } = useDisclosure();

  const onSubmit = async (data: FormData) => {
    try {
      const newCard = await createCard(columnId, data);
      toast.success('Cartão criado com sucesso');
      onCardCreated(newCard);
      toggle();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao criar cartão');
    }
  };

  return (
    <>
      <div onClick={() => toggle()}>{children}</div>

      <ResponsiveDrawer
        open={open}
        onOpenChange={() => toggle()}
        title="Novo Cartão"
        description="Crie um novo cartão para esta coluna."
        className="max-w-[700px]"
      >
        <CardForm
          schema={createCardBodySchema}
          defaultValues={{
            title: '',
            description: '',
            priority: null,
            dueDate: undefined,
            tagIds: [],
            budgetId: null,
            checklistItems: [],
          }}
          onSubmit={onSubmit}
          onCancel={() => toggle()}
          submitLabel="Criar"
          mode="create"
        />
      </ResponsiveDrawer>
    </>
  );
}
