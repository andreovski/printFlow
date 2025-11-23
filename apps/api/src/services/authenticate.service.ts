import { UsersRepository } from '@/repositories/users.repository';
import { compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken'; // Using fastify-jwt usually, but service logic might be framework agnostic.
// Actually, let's use the fastify instance or just return the payload and let controller sign.
// Better: Service returns user, Controller signs. Or Service returns token.
// Let's return user and let controller sign for simplicity with fastify-jwt.

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
