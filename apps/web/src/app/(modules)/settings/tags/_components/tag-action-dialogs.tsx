'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { deleteTagAction } from '../actions';

interface TagActionDialogsProps {
  id: string;
  isDeleteOpen: boolean;
  setIsDeleteOpen: (open: boolean) => void;
}

export function TagActionDialogs({ id, isDeleteOpen, setIsDeleteOpen }: TagActionDialogsProps) {
  const router = useRouter();
  return (
    <>
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen} modal={false}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Tag</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta tag? A tag será desativada e não aparecerá mais
              nas opções de seleção.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                const result = await deleteTagAction(id);
                if (result?.success) {
                  toast.success(result.message);
                  setIsDeleteOpen(false);
                  router.push('/settings/tags');
                } else {
                  toast.error(result?.message || 'Erro ao excluir tag');
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
