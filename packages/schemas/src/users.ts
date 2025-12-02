import { z } from 'zod';
import { Role } from '@magic-system/auth';

export const registerUserBodySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  earlyAccessCode: z.string().min(1, 'Código de acesso é obrigatório'),
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

// Profile update schemas
export const updateProfileBodySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
});

export const changePasswordBodySchema = z
  .object({
    currentPassword: z.string().min(6, 'Senha atual deve ter no mínimo 6 caracteres'),
    newPassword: z.string().min(6, 'Nova senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z.string().min(6, 'Confirmação deve ter no mínimo 6 caracteres'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>;
export type ChangePasswordBody = z.infer<typeof changePasswordBodySchema>;

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
