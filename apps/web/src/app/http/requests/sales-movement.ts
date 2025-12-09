import { SalesMovementListResponse, SalesMovementKPIsResponse } from '@magic-system/schemas';

import { api } from '../api';

interface SalesMovementParams {
  startDate: string;
  endDate: string;
  page?: number;
  pageSize?: number;
}

export async function getSalesMovement(
  params: SalesMovementParams
): Promise<SalesMovementListResponse> {
  const searchParams = new URLSearchParams({
    startDate: params.startDate,
    endDate: params.endDate,
    page: String(params.page || 1),
    pageSize: String(params.pageSize || 20),
  });

  return api.get(`sales-movement?${searchParams.toString()}`).json<SalesMovementListResponse>();
}

export async function getSalesMovementKPIs(
  params: Omit<SalesMovementParams, 'page' | 'pageSize'>
): Promise<SalesMovementKPIsResponse> {
  const searchParams = new URLSearchParams({
    startDate: params.startDate,
    endDate: params.endDate,
  });

  return api
    .get(`sales-movement/kpis?${searchParams.toString()}`)
    .json<SalesMovementKPIsResponse>();
}

export async function toggleExcludeFromSales(
  id: string,
  excludedFromSales: boolean
): Promise<{ id: string; excludedFromSales: boolean }> {
  return api
    .patch(`sales-movement/${id}/toggle-exclude`, { json: { excludedFromSales } })
    .json<{ id: string; excludedFromSales: boolean }>();
}
