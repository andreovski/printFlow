'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useInvalidateClients } from '@/app/http/hooks';

import { deleteClientAction } from '../actions';

interface ClientActionDialogsProps {
  id: string;
  isDeleteOpen: boolean;
  setIsDeleteOpen: (open: boolean) => void;
}

export function ClientActionDialogs({
  id,
  isDeleteOpen,
  setIsDeleteOpen,
}: ClientActionDialogsProps) {
  const router = useRouter();
  const invalidateClients = useInvalidateClients();
  return (
    <>
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen} modal={false}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Cliente</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                const result = await deleteClientAction(id);
                if (result?.success) {
                  invalidateClients();
                  setIsDeleteOpen(false);
                  router.push('/register/clients');
                }
              }}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
