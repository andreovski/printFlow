import { AuthenticateBody } from '@magic-system/schemas';

import { api } from '../api';

export async function authenticate(data: AuthenticateBody) {
  return api.post('sessions', { json: data }).json<{ token: string }>();
}

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  earlyAccessCode: string;
}) {
  return api.post('users', { json: data }).json();
}
