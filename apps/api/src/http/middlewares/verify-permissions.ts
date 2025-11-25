import { defineAbilityFor } from '@magic-system/auth';
import { FastifyReply, FastifyRequest } from 'fastify';

export function verifyUserRole(
  roleToVerify: 'MASTER' | 'ADMIN' | 'EMPLOYEE' | ('MASTER' | 'ADMIN' | 'EMPLOYEE')[]
) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { role } = request.user as { role: string };

    if (Array.isArray(roleToVerify)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!roleToVerify.includes(role as any)) {
        return reply.status(403).send({ message: 'Forbidden.' });
      }
    } else if (role !== roleToVerify) {
      return reply.status(403).send({ message: 'Forbidden.' });
    }
  };
}

// More advanced CASL middleware
export function checkAbility(action: string, subject: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const userPayload = request.user as {
      sub: string;
      role: string;
      organizationId: string;
    };

    // We might need to fetch the full user from DB to get organizationId if not in token
    // For now, assume token has: sub (id), role, organizationId

    const ability = defineAbilityFor({
      id: userPayload.sub,
      role: userPayload.role,
      organizationId: userPayload.organizationId,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (ability.cannot(action, subject as any)) {
      return reply.status(403).send({ message: 'Forbidden.' });
    }
  };
}
