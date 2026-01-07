import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { api } from '../api';
import { getNotifications, Notification } from '../requests/notifications';

export const notificationsQueryKey = ['notifications'];

export function useNotifications() {
  return useQuery<Notification[]>({
    queryKey: notificationsQueryKey,
    queryFn: getNotifications,
    // Atualiza a cada 5 minutos
    staleTime: 5 * 60 * 1000,
    // Mantém em cache por 10 minutos
    gcTime: 10 * 60 * 1000,
  });
}

export function useUnreadNotifications() {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => {
      const response = await api
        .get('notifications/unread')
        .json<{ notifications: Notification[] }>();
      return response.notifications;
    },
    refetchInterval: 5000, // Poll a cada 5 segundos para checar novos jobs
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api
        .put(`notifications/${id}/read`, { json: {} })
        .json<{ notification: Notification }>();
      return response.notification;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
      queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.put('notifications/mark-all-read', { json: {} });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
      queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
      toast.success('Todas as notificações foram marcadas como lidas');
    },
  });
}
