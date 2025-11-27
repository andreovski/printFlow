import { z } from 'zod';
import { Role } from '@magic-system/auth';

export const registerUserBodySchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
});

export const getUserParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createUserBodySchema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(Role),
});

export const updateUserParamsSchema = z.object({
  id: z.string().uuid(),
});

export const updateUserBodySchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(Role).optional(),
});

export const deleteUserParamsSchema = z.object({
  id: z.string().uuid(),
});

export type RegisterUserBody = z.infer<typeof registerUserBodySchema>;
export type GetUserParams = z.infer<typeof getUserParamsSchema>;
export type CreateUserBody = z.infer<typeof createUserBodySchema>;
export type UpdateUserParams = z.infer<typeof updateUserParamsSchema>;
export type UpdateUserBody = z.infer<typeof updateUserBodySchema>;
export type DeleteUserParams = z.infer<typeof deleteUserParamsSchema>;

// Entity type
export interface User {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  organizationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Response types
export interface RegisterUserResponse {
  user: User;
}

export interface CreateUserResponse {
  user: User;
}

export interface GetUserResponse {
  user: User;
}

export interface GetUsersResponse {
  users: User[];
}

export interface UpdateUserResponse {
  user: User;
}
