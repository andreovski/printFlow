'use client';

import { AccountsPayable, CreateAccountsPayableBody } from '@magic-system/schemas';
import { useState } from 'react';

import {
  useCreateAccountsPayable,
  useUpdateAccountsPayable,
} from '@/app/http/hooks/use-accounts-payable';
import { ResponsiveDrawer } from '@/components/responsive-drawer';

import { AccountsPayableForm } from './accounts-payable-form';
import { RecalculationDialog } from './recalculation-dialog';

interface AccountsPayableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: AccountsPayable;
}

export function AccountsPayableDialog({
  open,
  onOpenChange,
  initialData,
}: AccountsPayableDialogProps) {
  const createMutation = useCreateAccountsPayable();
  const updateMutation = useUpdateAccountsPayable();

  const [showRecalculationDialog, setShowRecalculationDialog] = useState(false);
  const [pendingData, setPendingData] = useState<CreateAccountsPayableBody | null>(null);
  const [subsequentCount, setSubsequentCount] = useState(0);

  const handleAmountChange = (hasSubsequent: boolean, count: number) => {
    if (hasSubsequent && count > 0) {
      setSubsequentCount(count);
    }
  };

  const handleSubmit = async (data: CreateAccountsPayableBody) => {
    // Se está editando uma parcela e o valor mudou, perguntar sobre recálculo
    if (
      initialData &&
      initialData.installmentNumber &&
      initialData.installmentOf &&
      initialData.installmentNumber < initialData.installmentOf &&
      data.amount !== initialData.amount
    ) {
      setPendingData(data);
      setShowRecalculationDialog(true);
      return;
    }

    // Submeter normalmente sem recálculo
    await submitData(data, false);
  };

  const submitData = async (data: CreateAccountsPayableBody, recalculateNext: boolean) => {
    try {
      if (initialData) {
        // Remove installments do payload de update (não pode ser alterado após criação)
        const { installments, ...updateData } = data;
        await updateMutation.mutateAsync({ id: initialData.id, data: updateData, recalculateNext });
      } else {
        await createMutation.mutateAsync(data);
      }
      onOpenChange(false);
      setPendingData(null);
      setShowRecalculationDialog(false);
    } catch (error) {
      // Toast de erro já é exibido no hook
      console.error('Error submitting accounts payable:', error);
    }
  };

  const handleRecalculationConfirm = async (recalculate: boolean) => {
    if (pendingData) {
      await submitData(pendingData, recalculate);
    }
  };

  const handleRecalculationCancel = () => {
    setShowRecalculationDialog(false);
    setPendingData(null);
  };

  return (
    <>
      <ResponsiveDrawer
        open={open}
        onOpenChange={onOpenChange}
        title={initialData ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}
        description={
          initialData
            ? 'Atualize as informações da conta a pagar'
            : 'Preencha os dados da nova conta a pagar'
        }
        className="max-w-2xl"
      >
        <div className="px-4 pb-4">
          <AccountsPayableForm
            initialData={initialData}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            onAmountChange={handleAmountChange}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        </div>
      </ResponsiveDrawer>

      <RecalculationDialog
        open={showRecalculationDialog}
        onConfirm={handleRecalculationConfirm}
        onCancel={handleRecalculationCancel}
        subsequentCount={subsequentCount}
        isSubmitting={updateMutation.isPending}
      />
    </>
  );
}
