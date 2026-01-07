import { api } from '../api';

export interface Notification {
  id: string;
  title: string;
  description?: string;
  message?: string;
  type:
    | 'info'
    | 'warning'
    | 'success'
    | 'error'
    | 'RECURRING_JOB_COMPLETED'
    | 'RECURRING_JOB_FAILED'
    | 'GENERAL';
  date?: string;
  createdAt?: string;
  read?: boolean;
  metadata?: Record<string, unknown>;
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
