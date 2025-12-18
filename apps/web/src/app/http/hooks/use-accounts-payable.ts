import {
  AccountsPayableFilters,
  CreateAccountsPayableBody,
  UpdateAccountsPayableBody,
} from '@magic-system/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  createAccountsPayable,
  deleteAccountsPayable,
  getAccountsPayable,
  getAccountsPayableKPIs,
  getDatesWithBills,
  getDeleteAccountsPayableInfo,
  updateAccountsPayable,
} from '../requests/accounts-payable';

export function useAccountsPayable(
  filters?: AccountsPayableFilters,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['accounts-payable', filters],
    queryFn: () => getAccountsPayable(filters),
    enabled: options?.enabled,
  });
}

export function useAccountsPayableKPIs(
  filters?: { startDate?: Date; endDate?: Date },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['accounts-payable-kpis', filters],
    queryFn: () => getAccountsPayableKPIs(filters),
    enabled: options?.enabled,
  });
}

export function useDatesWithBills(startDate: Date, endDate: Date, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['dates-with-bills', startDate.toISOString(), endDate.toISOString()],
    queryFn: () => getDatesWithBills(startDate, endDate),
    enabled: options?.enabled,
  });
}

export function useCreateAccountsPayable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAccountsPayableBody) => createAccountsPayable(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      queryClient.invalidateQueries({ queryKey: ['accounts-payable-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['dates-with-bills'] });
      const message =
        response.count === 1
          ? 'Conta a pagar criada com sucesso'
          : `${response.count} parcelas criadas com sucesso`;
      toast.success(message);
    },
    onError: () => {
      toast.error('Erro ao criar conta a pagar');
    },
  });
}

export function useUpdateAccountsPayable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
      recalculateNext = false,
    }: {
      id: string;
      data: UpdateAccountsPayableBody;
      recalculateNext?: boolean;
    }) => updateAccountsPayable(id, data, recalculateNext),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      queryClient.invalidateQueries({ queryKey: ['accounts-payable-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['dates-with-bills'] });
      toast.success('Conta a pagar atualizada com sucesso');
    },
    onError: () => {
      toast.error('Erro ao atualizar conta a pagar');
    },
  });
}

export function useDeleteAccountsPayableInfo() {
  return useMutation({
    mutationFn: (id: string) => getDeleteAccountsPayableInfo(id),
  });
}

export function useDeleteAccountsPayable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAccountsPayable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      queryClient.invalidateQueries({ queryKey: ['accounts-payable-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['dates-with-bills'] });
      toast.success('Conta a pagar excluída com sucesso');
    },
    onError: () => {
      toast.error('Erro ao excluir conta a pagar');
    },
  });
}
