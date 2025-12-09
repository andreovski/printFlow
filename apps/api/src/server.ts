import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import fastify from 'fastify';
import { ZodError } from 'zod';

import { appRoutes } from './http/routes';

export const app = fastify();

app.register(cookie);

app.register(cors, {
  origin: (process.env.FRONTEND_URL || 'http://localhost:3000').split(','),
  credentials: true,
});

app.register(jwt, {
  secret: process.env.JWT_SECRET || 'supersecret',
});

app.register(appRoutes);

app.setErrorHandler((error, _, reply) => {
  if (error instanceof ZodError) {
    return reply.status(400).send({ message: 'Validation error.', issues: error.format() });
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(error);
  }

  return reply.status(500).send({ message: 'Internal server error.' });
});

const PORT = Number(process.env.PORT) || 3333;

app.listen({ port: PORT, host: '0.0.0.0' }).then(() => {
  console.log(`HTTP Server Running on port ${PORT}`);
});
