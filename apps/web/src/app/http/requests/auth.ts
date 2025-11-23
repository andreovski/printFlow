import { api } from '../api';
import { AuthenticateBody } from '@magic-system/schemas';

export async function authenticate(data: AuthenticateBody) {
  return api.post('sessions', { json: data }).json<{ token: string }>();
}
