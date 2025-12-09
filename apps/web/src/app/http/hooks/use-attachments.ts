import { useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/app/http/api';

export interface Attachment {
  id: string;
  name: string;
  url: string;
  key: string;
  size: number;
  mimeType?: string | null;
  createdAt?: string;
}

interface UseAttachmentsOptions {
  entityType: 'budget' | 'card';
  entityId: string;
  enabled?: boolean;
}

export function useAttachments({ entityType, entityId, enabled = true }: UseAttachmentsOptions) {
  const apiEndpoint =
    entityType === 'budget' ? `budgets/${entityId}/attachments` : `cards/${entityId}/attachments`;

  return useQuery({
    queryKey: ['attachments', entityType, entityId],
    queryFn: () => api.get(apiEndpoint).json<{ attachments: Attachment[] }>(),
    enabled: enabled && !!entityId,
    select: (data) => data.attachments,
  });
}

export function useInvalidateAttachments() {
  const queryClient = useQueryClient();

  return (entityType: 'budget' | 'card', entityId: string) => {
    queryClient.invalidateQueries({
      queryKey: ['attachments', entityType, entityId],
    });
  };
}
