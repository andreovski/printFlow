import { FastifyReply, FastifyRequest } from 'fastify';

import { NotificationsService } from '@/services/notifications.service';

export async function getNotificationsController(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId } = request.user as { organizationId: string };

  const service = new NotificationsService();
  const notifications = await service.getNotifications(organizationId);

  return reply.status(200).send({ notifications });
}
