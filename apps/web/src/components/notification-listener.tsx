'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import {
  useUnreadNotifications,
  useMarkNotificationAsRead,
} from '@/app/http/hooks/use-notifications';

export function NotificationListener() {
  const { data: notifications } = useUnreadNotifications();
  const markAsReadMutation = useMarkNotificationAsRead();
  const processedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!notifications) return;

    notifications.forEach((notification) => {
      // Evitar processar a mesma notificação múltiplas vezes
      if (processedIds.current.has(notification.id)) return;

      processedIds.current.add(notification.id);

      // Mostrar toast baseado no tipo
      if (notification.type === 'RECURRING_JOB_COMPLETED') {
        toast.success(notification.title, {
          description: notification.message,
          icon: <CheckCircle2 className="h-5 w-5" />,
          duration: 8000,
          action: {
            label: 'OK',
            onClick: () => markAsReadMutation.mutate(notification.id),
          },
        });

        // Marcar como lida automaticamente após exibir
        setTimeout(() => {
          markAsReadMutation.mutate(notification.id);
        }, 8000);
      } else if (notification.type === 'RECURRING_JOB_FAILED') {
        toast.error(notification.title, {
          description: notification.message,
          icon: <XCircle className="h-5 w-5" />,
          duration: 10000,
          action: {
            label: 'OK',
            onClick: () => markAsReadMutation.mutate(notification.id),
          },
        });

        // Marcar como lida automaticamente após exibir
        setTimeout(() => {
          markAsReadMutation.mutate(notification.id);
        }, 10000);
      } else {
        // Notificação genérica
        toast(notification.title, {
          description: notification.message,
          duration: 6000,
          action: {
            label: 'OK',
            onClick: () => markAsReadMutation.mutate(notification.id),
          },
        });

        setTimeout(() => {
          markAsReadMutation.mutate(notification.id);
        }, 6000);
      }
    });
  }, [notifications, markAsReadMutation]);

  return null; // Componente não renderiza nada
}
