import { CreateClientBody, UpdateClientBody, UpdateClientParams } from '@magic-system/schemas';

import { api } from '../api';

export async function createClient(data: CreateClientBody) {
  return api.post('clients', { json: data }).json();
}

export async function getClients() {
  return api.get('clients').json();
}

export async function getClient(id: string) {
  return api.get(`clients/${id}`).json();
}

export async function updateClient({ id, ...data }: UpdateClientParams & UpdateClientBody) {
  return api.put(`clients/${id}`, { json: data }).json();
}

export async function deleteClient(id: string) {
  return api.delete(`clients/${id}`).json();
}
