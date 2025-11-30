import {
  CreateBudgetBody,
  UpdateBudgetBody,
  CreateBudgetResponse,
  GetBudgetResponse,
  UpdateBudgetResponse,
  Budget,
  PaginatedResponse,
  GenerateApprovalLinkResponse,
  PublicBudgetResponse,
} from '@magic-system/schemas';

import { api } from '../api';

export async function createBudget(data: CreateBudgetBody): Promise<CreateBudgetResponse> {
  return api.post('budgets', { json: data }).json<CreateBudgetResponse>();
}

export async function getBudgets(params?: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<Budget>> {
  const searchParams = new URLSearchParams({
    page: String(params?.page || 1),
    pageSize: String(params?.pageSize || 10),
  });

  return api.get(`budgets?${searchParams.toString()}`).json<PaginatedResponse<Budget>>();
}

export async function getArchivedBudgets(params?: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<Budget>> {
  const searchParams = new URLSearchParams({
    page: String(params?.page || 1),
    pageSize: String(params?.pageSize || 10),
  });

  return api.get(`budgets/archived?${searchParams.toString()}`).json<PaginatedResponse<Budget>>();
}

export async function getBudget(id: string): Promise<GetBudgetResponse> {
  return api.get(`budgets/${id}`).json<GetBudgetResponse>();
}

export async function updateBudget(
  id: string,
  data: UpdateBudgetBody
): Promise<UpdateBudgetResponse> {
  return api.put(`budgets/${id}`, { json: data }).json<UpdateBudgetResponse>();
}

export async function updateBudgetStatus(
  id: string,
  status: string
): Promise<UpdateBudgetResponse> {
  return api.patch(`budgets/${id}/status`, { json: { status } }).json<UpdateBudgetResponse>();
}

export async function deleteBudget(id: string): Promise<void> {
  return api.delete(`budgets/${id}`).json<void>();
}

export async function archiveBudget(id: string): Promise<void> {
  return api.patch(`budgets/${id}/archive`, { json: {} }).json<void>();
}

export async function generateApprovalLink(id: string): Promise<GenerateApprovalLinkResponse> {
  return api.post(`budgets/${id}/generate-link`, { json: {} }).json<GenerateApprovalLinkResponse>();
}
