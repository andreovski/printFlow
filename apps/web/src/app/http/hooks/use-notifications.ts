import { useQuery } from '@tanstack/react-query';

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
