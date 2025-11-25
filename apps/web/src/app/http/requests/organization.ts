import { Organization } from '@magic-system/schemas';

import { api } from '../api';

export async function getOrganization() {
  return api.get<{ organization: Organization }>('organization').json();
}
