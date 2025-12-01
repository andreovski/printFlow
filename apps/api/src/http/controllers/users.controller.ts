import {
  registerUserBodySchema,
  getUserParamsSchema,
  createUserBodySchema,
  updateUserParamsSchema,
  updateUserBodySchema,
  deleteUserParamsSchema,
  paginationQuerySchema,
  updateProfileBodySchema,
  changePasswordBodySchema,
} from '@magic-system/schemas';
import { Role } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

import { UsersRepository } from '@/repositories/users.repository';
import { UsersService } from '@/services/users.service';

const usersRepository = new UsersRepository();
const usersService = new UsersService(usersRepository);

export async function registerUserController(request: FastifyRequest, reply: FastifyReply) {
  const { name, email, password } = registerUserBodySchema.parse(request.body);

  try {
    const { user } = await usersService.register({
      name: name ?? '',
      email,
      password,
    });

    return reply.status(201).send({ user });
  } catch (err) {
    if (err instanceof Error && err.message === 'User already exists.') {
      return reply.status(409).send({ message: err.message });
    }
    throw err;
  }
}

export async function fetchUsersController(request: FastifyRequest, reply: FastifyReply) {
  const { page, pageSize } = paginationQuerySchema.parse(request.query);
  const response = await usersService.fetchUsers(page, pageSize);
  return reply.status(200).send(response);
}

export async function getUserController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = getUserParamsSchema.parse(request.params);

  try {
    const { user } = await usersService.getUser(id);
    return reply.status(200).send({ user });
  } catch (_err) {
    return reply.status(404).send({ message: 'User not found' });
  }
}

export async function createUserController(request: FastifyRequest, reply: FastifyReply) {
  const { name, email, password, role } = createUserBodySchema.parse(request.body);
  const { organizationId } = request.user as { organizationId: string };

  try {
    const { user } = await usersService.createUser({
      name: name ?? '',
      email,
      password,
      role: role as Role,
      organizationId,
    });

    return reply.status(201).send({ user });
  } catch (err) {
    if (err instanceof Error && err.message === 'User already exists.') {
      return reply.status(409).send({ message: err.message });
    }
    throw err;
  }
}

export async function updateUserController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = updateUserParamsSchema.parse(request.params);
  const data = updateUserBodySchema.parse(request.body);

  try {
    const { user } = await usersService.updateUser(id, data);
    return reply.status(200).send({ user });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'User not found.') {
        return reply.status(404).send({ message: err.message });
      }
      if (err.message === 'Cannot edit a user with MASTER role.') {
        return reply.status(403).send({ message: err.message });
      }
    }
    throw err;
  }
}

export async function deleteUserController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = deleteUserParamsSchema.parse(request.params);

  await usersService.deleteUser(id);

  return reply.status(204).send();
}

export async function getProfileController(request: FastifyRequest, reply: FastifyReply) {
  const { sub: userId } = request.user as { sub: string };

  try {
    const { user } = await usersService.getUser(userId);
    return reply.status(200).send({ user });
  } catch (_err) {
    return reply.status(404).send({ message: 'User not found' });
  }
}

export async function updateProfileController(request: FastifyRequest, reply: FastifyReply) {
  const { sub: userId } = request.user as { sub: string };
  const data = updateProfileBodySchema.parse(request.body);

  try {
    const { user } = await usersService.updateProfile(userId, data);
    return reply.status(200).send({ user });
  } catch (err) {
    if (err instanceof Error && err.message === 'User not found.') {
      return reply.status(404).send({ message: err.message });
    }
    throw err;
  }
}

export async function changePasswordController(request: FastifyRequest, reply: FastifyReply) {
  const { sub: userId } = request.user as { sub: string };
  const data = changePasswordBodySchema.parse(request.body);

  try {
    await usersService.changePassword(userId, {
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
    return reply.status(200).send({ message: 'Password changed successfully.' });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'User not found.') {
        return reply.status(404).send({ message: err.message });
      }
      if (err.message === 'Current password is incorrect.') {
        return reply.status(400).send({ message: 'Senha atual incorreta.' });
      }
    }
    throw err;
  }
}
