'use server';

import { Role } from '@magic-system/auth';
import { CreateUserBody, UpdateUserBody } from '@magic-system/schemas';
import { HTTPError } from 'ky';
import { revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';

import { createUser, updateUser, deleteUser } from '@/app/http/requests/users';


export async function createUserAction(prevState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as Role;

  const data: CreateUserBody = {
    name,
    email,
    password,
    role,
  };

  try {
    await createUser(data);

    revalidateTag('users');
  } catch (err) {
    if (err instanceof HTTPError) {
      const errorData = await err.response.json();
      return { error: errorData.message || 'Failed to create user' };
    }
    return { error: 'Something went wrong' };
  }

  redirect('/register/accesses');
}

export async function updateUserAction(id: string, prevState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const role = formData.get('role') as Role;

  const data: UpdateUserBody = {
    name,
    email,
    role,
  };

  try {
    await updateUser({ id, ...data });

    revalidateTag('users');
  } catch (err) {
    if (err instanceof HTTPError) {
      const errorData = await err.response.json();
      return { error: errorData.message || 'Failed to update user' };
    }
    return { error: 'Something went wrong' };
  }

  redirect('/register/accesses');
}

export async function deleteUserAction(id: string) {
  try {
    await deleteUser(id);

    revalidateTag('users');
  } catch (err) {
    console.error(err);
  }
}
