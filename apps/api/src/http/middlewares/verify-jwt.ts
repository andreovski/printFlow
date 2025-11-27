import { FastifyReply, FastifyRequest } from 'fastify';

export async function verifyJwt(request: FastifyRequest, reply: FastifyReply) {
  try {
    const token = request.cookies.token;

    if (token && !request.headers.authorization) {
      request.headers.authorization = `Bearer ${token}`;
    }

    await request.jwtVerify();
  } catch (_err) {
    return reply.status(401).send({ message: 'Unauthorized.' });
  }
}
