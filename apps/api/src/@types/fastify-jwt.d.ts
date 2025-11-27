import '@fastify/jwt';
import { Role } from '@magic-system/auth';

declare module '@fastify/jwt' {
  export interface FastifyJWT {
    user: {
      sub: string;
      role: Role;
      organizationId: string;
    };
  }
}
