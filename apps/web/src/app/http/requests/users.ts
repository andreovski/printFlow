import {
  CreateUserBody,
  UpdateUserBody,
  UpdateUserParams,
  RegisterUserBody,
  RegisterUserResponse,
  CreateUserResponse,
  GetUserResponse,
  UpdateUserResponse,
  UpdateProfileBody,
  ChangePasswordBody,
  User,
  PaginatedResponse,
} from '@magic-system/schemas';

import { api } from '../api';

export async function registerUser(data: RegisterUserBody): Promise<RegisterUserResponse> {
  return api.post('users', { json: data }).json<RegisterUserResponse>();
}

export async function createUser(data: CreateUserBody): Promise<CreateUserResponse> {
  return api.post('users/create', { json: data }).json<CreateUserResponse>();
}

export async function getUsers(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<PaginatedResponse<User>> {
  const searchParams = new URLSearchParams({
    page: String(params?.page || 1),
    pageSize: String(params?.pageSize || 10),
  });

  if (params?.search) {
    searchParams.append('search', params.search);
  }

  return api.get(`users?${searchParams.toString()}`).json<PaginatedResponse<User>>();
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
