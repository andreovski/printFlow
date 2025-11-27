import {
  CreateClientBody,
  UpdateClientBody,
  UpdateClientParams,
  CreateClientResponse,
  GetClientResponse,
  UpdateClientResponse,
  Client,
  PaginatedResponse,
} from '@magic-system/schemas';

import { api } from '../api';

export async function createClient(data: CreateClientBody): Promise<CreateClientResponse> {
  return api.post('clients', { json: data }).json<CreateClientResponse>();
}

export async function getClients(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<PaginatedResponse<Client>> {
  const searchParams = new URLSearchParams({
    page: String(params?.page || 1),
    pageSize: String(params?.pageSize || 10),
  });

  if (params?.search) {
    searchParams.append('search', params.search);
  }

  return api.get(`clients?${searchParams.toString()}`).json<PaginatedResponse<Client>>();
}

export async function getClient(id: string): Promise<GetClientResponse> {
  return api.get(`clients/${id}`).json<GetClientResponse>();
}

export async function updateClient({
  id,
  ...data
}: UpdateClientParams & UpdateClientBody): Promise<UpdateClientResponse> {
  return api.put(`clients/${id}`, { json: data }).json<UpdateClientResponse>();
}

export async function deleteClient(id: string): Promise<void> {
  return api.delete(`clients/${id}`).json<void>();
}
