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
import { useInvalidateTemplates } from '@/app/http/hooks';

import { deleteTemplateAction } from '../actions';

interface TemplateActionDialogsProps {
  id: string;
  isDeleteOpen: boolean;
  setIsDeleteOpen: (open: boolean) => void;
}

export function TemplateActionDialogs({
  id,
  isDeleteOpen,
  setIsDeleteOpen,
}: TemplateActionDialogsProps) {
  const router = useRouter();
  const invalidateTemplates = useInvalidateTemplates();

  return (
    <>
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen} modal={false}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Template</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este template? O template será desativado e não
              aparecerá mais nas opções de seleção.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                const result = await deleteTemplateAction(id);
                if (result?.success) {
                  toast.success(result.message);
                  invalidateTemplates(); // Invalida cache do React Query
                  setIsDeleteOpen(false);
                  router.push('/settings/templates');
                } else {
                  toast.error(result?.message || 'Erro ao excluir template');
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
