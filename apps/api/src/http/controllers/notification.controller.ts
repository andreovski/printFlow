import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { NotificationService } from '@/services/notification.service';

const markAsReadParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function getUnreadNotificationsController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { sub: userId } = request.user as { sub: string };

  const service = new NotificationService();
  const notifications = await service.findUnreadByUser(userId);

  return reply.status(200).send({ notifications });
}

export async function markNotificationAsReadController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id } = markAsReadParamsSchema.parse(request.params);

  const service = new NotificationService();
  const notification = await service.markAsRead(id);

  return reply.status(200).send({ notification });
}

export async function markAllNotificationsAsReadController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { sub: userId } = request.user as { sub: string };

  const service = new NotificationService();
  await service.markAllAsRead(userId);

  return reply.status(204).send();
}
