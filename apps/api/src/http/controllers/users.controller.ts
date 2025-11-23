import { FastifyReply, FastifyRequest } from 'fastify';
import {
  registerUserBodySchema,
  getUserParamsSchema,
  createUserBodySchema,
  updateUserParamsSchema,
  updateUserBodySchema,
  deleteUserParamsSchema,
} from '@magic-system/schemas';
import { prisma } from '@/lib/prisma';
import { UsersRepository } from '@/repositories/users.repository';
import { UsersService } from '@/services/users.service';
import { Role } from '@magic-system/auth';

const usersRepository = new UsersRepository();
const usersService = new UsersService(usersRepository);

export async function registerUserController(request: FastifyRequest, reply: FastifyReply) {
  const { name, email, password } = registerUserBodySchema.parse(request.body);

  try {
    const { user } = await usersService.register({
      name,
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
  const { users } = await usersService.fetchUsers();
  return reply.status(200).send({ users });
}

export async function getUserController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = getUserParamsSchema.parse(request.params);

  try {
    const { user } = await usersService.getUser(id);
    return reply.status(200).send({ user });
  } catch (err) {
    return reply.status(404).send({ message: 'User not found' });
  }
}

export async function createUserController(request: FastifyRequest, reply: FastifyReply) {
  const { name, email, password, role } = createUserBodySchema.parse(request.body);
  const { organizationId } = request.user as { organizationId: string };

  try {
    const { user } = await usersService.createUser({
      name,
      email,
      password,
      role,
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
