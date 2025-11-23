import { FastifyReply, FastifyRequest } from 'fastify';
import { authenticateBodySchema } from '@magic-system/schemas';
import { AuthenticateService } from '@/services/authenticate.service';
import { UsersRepository } from '@/repositories/users.repository';

export async function authenticateController(request: FastifyRequest, reply: FastifyReply) {
  const { email, password } = authenticateBodySchema.parse(request.body);

  const usersRepository = new UsersRepository();
  const authenticateService = new AuthenticateService(usersRepository);

  try {
    const { user } = await authenticateService.execute({
      email,
      password,
    });

    const token = await reply.jwtSign(
      {
        role: user.role,
        organizationId: user.organizationId,
      },
      {
        sign: {
          sub: user.id,
        },
      }
    );

    return reply.status(200).send({
      token,
    });
  } catch (err) {
    return reply.status(400).send({ message: 'Invalid credentials.' });
  }
}
