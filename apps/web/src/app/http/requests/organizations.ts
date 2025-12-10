import { api } from '../api';

export async function createOrganization(data: {
  name: string;
  cnpj?: string;
  enterpriseName?: string;
  mainEmail: string;
  mainPhone: string;
  cep: string;
  address: string;
  number: string;
  complement?: string;
  city: string;
  state: string;
  country?: string;
  logoUrl?: string;
}) {
  return api.post('organizations/create', { json: data }).json<{ token: string }>();
}
