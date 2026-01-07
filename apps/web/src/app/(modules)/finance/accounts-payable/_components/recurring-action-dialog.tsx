'use client';

import { Repeat } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface RecurringActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: 'update' | 'delete';
  futureCount: number;
  position?: number;
  onConfirm: (applyToAll: boolean) => void;
  isLoading?: boolean;
}

export function RecurringActionDialog({
  open,
  onOpenChange,
  action,
  futureCount,
  position = 1,
  onConfirm,
  isLoading,
}: RecurringActionDialogProps) {
  const [selected, setSelected] = React.useState<'single' | 'all'>('single');

  const actionLabel = action === 'update' ? 'alteração' : 'exclusão';
  const actionVerb = action === 'update' ? 'atualizar' : 'excluir';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Confirmar {actionLabel} em conta recorrente
          </DialogTitle>
          <DialogDescription>
            Esta é uma conta recorrente (posição {position}/60). Como deseja aplicar a {actionLabel}
            ?
          </DialogDescription>
        </DialogHeader>

        <RadioGroup value={selected} onValueChange={(v) => setSelected(v as 'single' | 'all')}>
          <div className="flex items-center space-x-2 rounded-md border p-4 cursor-pointer hover:bg-accent">
            <RadioGroupItem value="single" id="single" />
            <Label htmlFor="single" className="flex-1 cursor-pointer">
              <p className="font-medium">Apenas esta conta</p>
              <p className="text-sm text-muted-foreground">
                {action === 'update'
                  ? 'Altera somente esta conta. As futuras permanecem inalteradas.'
                  : 'Remove somente esta conta. As futuras continuam ativas.'}
              </p>
            </Label>
          </div>

          <div className="flex items-center space-x-2 rounded-md border p-4 cursor-pointer hover:bg-accent">
            <RadioGroupItem value="all" id="all" />
            <Label htmlFor="all" className="flex-1 cursor-pointer">
              <p className="font-medium">Esta e todas as futuras ({futureCount})</p>
              <p className="text-sm text-muted-foreground">
                {action === 'update'
                  ? `Aplica a alteração em ${futureCount + 1} contas (esta + ${futureCount} futuras não pagas).`
                  : `Remove ${futureCount + 1} contas (esta + ${futureCount} futuras).`}
              </p>
            </Label>
          </div>
        </RadioGroup>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => {
              onConfirm(selected === 'all');
              onOpenChange(false);
            }}
            disabled={isLoading}
            variant={action === 'delete' ? 'destructive' : 'default'}
          >
            {isLoading
              ? 'Processando...'
              : `${actionVerb.charAt(0).toUpperCase() + actionVerb.slice(1)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
