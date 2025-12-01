import {
  CreateUserBody,
  UpdateUserBody,
  UpdateUserParams,
  RegisterUserBody,
  RegisterUserResponse,
  CreateUserResponse,
  GetUserResponse,
  GetUsersResponse,
  UpdateUserResponse,
  UpdateProfileBody,
  ChangePasswordBody,
} from '@magic-system/schemas';

import { api } from '../api';

export async function registerUser(data: RegisterUserBody): Promise<RegisterUserResponse> {
  return api.post('users', { json: data }).json<RegisterUserResponse>();
}

export async function createUser(data: CreateUserBody): Promise<CreateUserResponse> {
  return api.post('users/create', { json: data }).json<CreateUserResponse>();
}

export async function getUsers(): Promise<GetUsersResponse> {
  return api.get('users').json<GetUsersResponse>();
}

export async function getUser(id: string): Promise<GetUserResponse> {
  return api.get(`users/${id}`).json<GetUserResponse>();
}

export async function updateUser({
  id,
  ...data
}: UpdateUserParams & UpdateUserBody): Promise<UpdateUserResponse> {
  return api.put(`users/${id}`, { json: data }).json<UpdateUserResponse>();
}

export async function deleteUser(id: string): Promise<void> {
  return api.delete(`users/${id}`).json<void>();
}

export async function updateProfile(data: UpdateProfileBody): Promise<UpdateUserResponse> {
  return api.put('profile', { json: data }).json<UpdateUserResponse>();
}

export async function changePassword(
  data: Omit<ChangePasswordBody, 'confirmPassword'>
): Promise<{ message: string }> {
  return api.put('profile/password', { json: data }).json<{ message: string }>();
}
