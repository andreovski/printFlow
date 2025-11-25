import { AuthenticateBody } from '@magic-system/schemas';

import { api } from '../api';

export async function authenticate(data: AuthenticateBody) {
  return api.post('sessions', { json: data }).json<{ token: string }>();
}
