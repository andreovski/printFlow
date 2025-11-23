import { UsersRepository } from '@/repositories/users.repository';
import { User } from '@prisma/client';
import { hash } from 'bcryptjs';
import { z } from 'zod';

interface RegisterUserRequest {
  name: string; // Not in DB yet, but assuming for future
  email: string;
  password: string;
}

interface RegisterUserResponse {
  user: User;
}

export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  async register({ email, password }: RegisterUserRequest): Promise<RegisterUserResponse> {
    const passwordHash = await hash(password, 6);

    const userWithSameEmail = await this.usersRepository.findByEmail(email);

    if (userWithSameEmail) {
      throw new Error('User already exists.');
    }

    const user = await this.usersRepository.create({
      email,
      passwordHash,
      // Default role is EMPLOYEE in schema
    });

    return {
      user,
    };
  }

  async fetchUsers() {
    const users = await this.usersRepository.findMany();
    return { users };
  }

  async getUser(id: string) {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new Error('User not found.');
    }

    return { user };
  }

  async createUser({ name, email, password, role, organizationId }: any) {
    const passwordHash = await hash(password, 6);
    const userWithSameEmail = await this.usersRepository.findByEmail(email);

    if (userWithSameEmail) {
      throw new Error('User already exists.');
    }

    const user = await this.usersRepository.create({
      name,
      email,
      passwordHash,
      role,
      organization: {
        connect: { id: organizationId },
      },
    });

    return { user };
  }

  async updateUser(id: string, data: any) {
    const userToUpdate = await this.usersRepository.findById(id);

    if (!userToUpdate) {
      throw new Error('User not found.');
    }

    if (userToUpdate.role === 'MASTER') {
      throw new Error('Cannot edit a user with MASTER role.');
    }

    const user = await this.usersRepository.update(id, data);
    return { user };
  }

  async deleteUser(id: string) {
    await this.usersRepository.delete(id);
  }
}
