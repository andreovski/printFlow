'use client';

import { DialogAction } from '@/components/dialog-action';
import { Button } from '@/components/ui/button';

interface RecalculationDialogProps {
  open: boolean;
  onConfirm: (recalculate: boolean) => void;
  onCancel: () => void;
  subsequentCount: number;
  isSubmitting?: boolean;
}

export function RecalculationDialog({
  open,
  onConfirm,
  onCancel,
  subsequentCount,
  isSubmitting = false,
}: RecalculationDialogProps) {
  return (
    <DialogAction
      open={open}
      title="Recalcular parcelas seguintes?"
      subtitle={`Este novo valor será aplicado em ${subsequentCount} parcela(s) subsequente(s). Deseja recalcular todas as parcelas seguintes ou alterar apenas esta?`}
      onRefuse={() => !isSubmitting && onCancel()}
      disabled={isSubmitting}
      modal={false}
      confirmButton={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onConfirm(false)} disabled={isSubmitting}>
            Apenas Esta
          </Button>
          <Button onClick={() => onConfirm(true)} disabled={isSubmitting}>
            {isSubmitting
              ? 'Salvando...'
              : `Recalcular ${subsequentCount} Parcela${subsequentCount > 1 ? 's' : ''}`}
          </Button>
        </div>
      }
    />
  );
}
