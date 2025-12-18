import {
  AccountsPayable,
  AccountsPayableFilters,
  AccountsPayableKPIs,
  CreateAccountsPayableBody,
  UpdateAccountsPayableBody,
  DeleteAccountsPayableInfo,
} from '@magic-system/schemas';

import { api } from '../api';

export async function getAccountsPayable(
  filters?: AccountsPayableFilters
): Promise<{ accountsPayable: AccountsPayable[] }> {
  const searchParams = new URLSearchParams();

  if (filters?.startDate) {
    searchParams.append('startDate', filters.startDate.toISOString());
  }
  if (filters?.endDate) {
    searchParams.append('endDate', filters.endDate.toISOString());
  }
  if (filters?.search) {
    searchParams.append('search', filters.search);
  }
  if (filters?.status) {
    searchParams.append('status', filters.status);
  }

  const queryString = searchParams.toString();
  const url = `accounts-payable${queryString ? `?${queryString}` : ''}`;

  return api.get(url).json();
}

export async function getAccountsPayableKPIs(filters?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<{ kpis: AccountsPayableKPIs }> {
  const searchParams = new URLSearchParams();

  if (filters?.startDate) {
    searchParams.append('startDate', filters.startDate.toISOString());
  }
  if (filters?.endDate) {
    searchParams.append('endDate', filters.endDate.toISOString());
  }

  const queryString = searchParams.toString();
  const url = `accounts-payable/kpis${queryString ? `?${queryString}` : ''}`;

  return api.get(url).json();
}

export async function getDatesWithBills(
  startDate: Date,
  endDate: Date
): Promise<{ dates: string[] }> {
  const searchParams = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });

  return api.get(`accounts-payable/dates-with-bills?${searchParams}`).json();
}

export async function createAccountsPayable(
  data: CreateAccountsPayableBody
): Promise<{ accountsPayable: AccountsPayable[]; count: number }> {
  return api.post('accounts-payable', { json: data }).json();
}

export async function updateAccountsPayable(
  id: string,
  data: UpdateAccountsPayableBody,
  recalculateNext: boolean = false
): Promise<{ accountPayable: AccountsPayable }> {
  const searchParams = new URLSearchParams();
  if (recalculateNext) {
    searchParams.append('recalculateNext', 'true');
  }
  const queryString = searchParams.toString();
  const url = `accounts-payable/${id}${queryString ? `?${queryString}` : ''}`;
  return api.put(url, { json: data }).json();
}

export async function getDeleteAccountsPayableInfo(id: string): Promise<DeleteAccountsPayableInfo> {
  return api.get(`accounts-payable/${id}/delete-info`).json();
}

export async function deleteAccountsPayable(id: string): Promise<void> {
  await api.delete(`accounts-payable/${id}`);
}
