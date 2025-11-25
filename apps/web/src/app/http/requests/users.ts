import {
  CreateUserBody,
  UpdateUserBody,
  UpdateUserParams,
  RegisterUserBody,
} from '@magic-system/schemas';

import { api } from '../api';

export async function registerUser(data: RegisterUserBody) {
  return api.post('users', { json: data }).json();
}

export async function createUser(data: CreateUserBody) {
  return api.post('users/create', { json: data }).json();
}

export async function getUsers() {
  return api.get('users').json();
}

export async function getUser(id: string) {
  return api.get(`users/${id}`).json();
}

export async function updateUser({ id, ...data }: UpdateUserParams & UpdateUserBody) {
  return api.put(`users/${id}`, { json: data }).json();
}

export async function deleteUser(id: string) {
  return api.delete(`users/${id}`).json();
}
