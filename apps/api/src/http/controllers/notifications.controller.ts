import { FastifyReply, FastifyRequest } from 'fastify';

import { NotificationsService } from '@/services/notifications.service';

export async function getNotificationsController(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId, role } = request.user as { organizationId: string; role: string };

  const service = new NotificationsService();
  const notifications = await service.getNotifications(organizationId, role);

  return reply.status(200).send({ notifications });
}
