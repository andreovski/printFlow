import { User, Role } from '@prisma/client';
import { compare, hash } from 'bcryptjs';

import { UsersRepository } from '@/repositories/users.repository';

interface RegisterUserRequest {
  name: string;
  email: string;
  password: string;
  earlyAccessCode: string;
}

interface RegisterUserResponse {
  user: User;
}

export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  async register({
    name,
    email,
    password,
    earlyAccessCode,
  }: RegisterUserRequest): Promise<RegisterUserResponse> {
    // Validar código de acesso antecipado
    if (earlyAccessCode !== process.env.EARLY_ACCESS_CODE) {
      throw new Error('Invalid early access code.');
    }

    const passwordHash = await hash(password, 6);

    const userWithSameEmail = await this.usersRepository.findByEmail(email);

    if (userWithSameEmail) {
      throw new Error('User already exists.');
    }

    const user = await this.usersRepository.create({
      name,
      email,
      passwordHash,
      // Default role is EMPLOYEE in schema
    });

    return {
      user,
    };
  }

  async fetchUsers(page: number = 1, pageSize: number = 10, organizationId?: string) {
    const { data, total } = await this.usersRepository.findMany(page, pageSize, organizationId);
    const totalPages = Math.ceil(total / pageSize);

    return {
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  }

  async getUser(id: string) {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new Error('User not found.');
    }

    return { user };
  }

  async createUser({
    name,
    email,
    password,
    role,
    organizationId,
  }: {
    name: string;
    email: string;
    password: string;
    role?: Role;
    organizationId: string;
  }) {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  async updateProfile(id: string, data: { name: string }) {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new Error('User not found.');
    }

    const updatedUser = await this.usersRepository.update(id, { name: data.name });
    return { user: updatedUser };
  }

  async changePassword(id: string, data: { currentPassword: string; newPassword: string }) {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new Error('User not found.');
    }

    const doesPasswordMatch = await compare(data.currentPassword, user.passwordHash);

    if (!doesPasswordMatch) {
      throw new Error('Current password is incorrect.');
    }

    const newPasswordHash = await hash(data.newPassword, 6);
    const updatedUser = await this.usersRepository.update(id, {
      passwordHash: newPasswordHash,
    });

    return { user: updatedUser };
  }
}
