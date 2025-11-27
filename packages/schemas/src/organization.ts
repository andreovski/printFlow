import { z } from 'zod';

export const organizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  ownerId: z.string(),
  budgetAutoInactive: z.boolean().optional(),
  budgetAutoArchive: z.boolean().optional(),
  budgetShowTotalInKanban: z.boolean().optional(),
});

export type Organization = z.infer<typeof organizationSchema>;
