import { Organization } from '@magic-system/schemas';

import { api } from '../api';

export async function getOrganization() {
  return api.get<{ organization: Organization }>('organization').json();
}

export async function updateOrganization(data: Partial<Organization>) {
  return api.put<{ organization: Organization }>('organization', { json: data }).json();
}
