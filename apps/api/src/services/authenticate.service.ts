import { compare } from 'bcryptjs';

import { UsersRepository } from '@/repositories/users.repository';

interface AuthenticateRequest {
  email: string;
  password: string;
}

export class AuthenticateService {
  constructor(private usersRepository: UsersRepository) {}

  async execute({ email, password }: AuthenticateRequest) {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      throw new Error('Invalid credentials.');
    }

    const doesPasswordMatch = await compare(password, user.passwordHash);

    if (!doesPasswordMatch) {
      throw new Error('Invalid credentials.');
    }

    return {
      user,
    };
  }
}
