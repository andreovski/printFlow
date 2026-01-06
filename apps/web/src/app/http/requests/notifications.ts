import { api } from '../api';

export interface Notification {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'warning' | 'success' | 'error';
  date: string;
  route?: string;
}

interface GetNotificationsResponse {
  notifications: Notification[];
}

export async function getNotifications(): Promise<Notification[]> {
  const response = await api.get('notifications');
  const data = await response.json<GetNotificationsResponse>();
  return data.notifications;
}
