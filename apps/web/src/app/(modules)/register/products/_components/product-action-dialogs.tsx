'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { useInvalidateProducts } from '@/app/http/hooks';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { deleteProductAction } from '../actions';

interface ProductActionDialogsProps {
  id: string;
  isDeleteOpen: boolean;
  setIsDeleteOpen: (open: boolean) => void;
}

export function ProductActionDialogs({
  id,
  isDeleteOpen,
  setIsDeleteOpen,
}: ProductActionDialogsProps) {
  const router = useRouter();
  const invalidateProducts = useInvalidateProducts();
  return (
    <>
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen} modal={false}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Produto</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                const result = await deleteProductAction(id);
                if (result?.success) {
                  toast.success(result.message);
                  invalidateProducts();
                  setIsDeleteOpen(false);
                  router.push('/register/products');
                } else {
                  toast.error(result?.message || 'Erro ao excluir produto');
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
