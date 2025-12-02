'use server';

import { HTTPError } from 'ky';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { authenticate, registerUser } from '@/app/http/requests/auth';
import { createOrganization } from '@/app/http/requests/organizations';

export async function signInAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    const { token } = await authenticate({ email, password });

    const cookieStore = await cookies();

    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    cookieStore.set('token-client', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Decodificar token para verificar se usuário possui organização
    const payload = JSON.parse(atob(token.split('.')[1]));

    // Redirecionar baseado em organização
    if (!payload.organizationId) {
      return redirect('/auth/setup-organization');
    }
  } catch (err) {
    if (err instanceof HTTPError) {
      return { error: 'Invalid credentials' };
    }
    return { error: 'Something went wrong' };
  }

  redirect('/');
}

export async function signUpAction(prevState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const earlyAccessCode = formData.get('earlyAccessCode') as string;

  try {
    await registerUser({ name, email, password, earlyAccessCode });

    // Auto-login após registro
    const { token } = await authenticate({ email, password });

    const cookieStore = await cookies();

    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    cookieStore.set('token-client', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
  } catch (err) {
    if (err instanceof HTTPError) {
      const response = await err.response.json();
      return { error: response.message || 'Erro ao cadastrar.' };
    }
    return { error: 'Erro ao cadastrar.' };
  }

  redirect('/auth/setup-organization');
}

export async function createOrganizationAction(prevState: any, formData: FormData) {
  const data = {
    name: formData.get('name') as string,
    cnpj: (formData.get('cnpj') as string) || undefined,
    enterpriseName: (formData.get('enterpriseName') as string) || undefined,
    mainEmail: formData.get('mainEmail') as string,
    mainPhone: formData.get('mainPhone') as string,
    cep: formData.get('cep') as string,
    address: formData.get('address') as string,
    number: formData.get('number') as string,
    complement: (formData.get('complement') as string) || undefined,
    city: formData.get('city') as string,
    state: formData.get('state') as string,
    country: (formData.get('country') as string) || 'Brasil',
  };

  try {
    const { token } = await createOrganization(data);

    const cookieStore = await cookies();

    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    cookieStore.set('token-client', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
  } catch (err) {
    if (err instanceof HTTPError) {
      const response = await err.response.json();
      return { error: response.message || 'Erro ao criar organização.' };
    }
    return { error: 'Erro ao criar organização.' };
  }

  redirect('/');
}

export async function signOutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('token');
  cookieStore.delete('token-client');

  return redirect('/auth/sign-in');
}
