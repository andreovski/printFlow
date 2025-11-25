'use server';

import { HTTPError } from 'ky';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { authenticate } from '@/app/http/requests/auth';

export async function signInAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    const { token } = await authenticate({ email, password });

    const cookieStore = await cookies();

    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
  } catch (err) {
    if (err instanceof HTTPError) {
      return { error: 'Invalid credentials' };
    }
    return { error: 'Something went wrong' };
  }

  redirect('/');
}

export async function signOutAction() {
  cookies().delete('token');
  redirect('/auth/sign-in');
}
