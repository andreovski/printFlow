import { z } from 'zod';

export const userSchema = z.object({
  __typename: z.literal('User').optional(),
  id: z.string(),
  role: z.string(),
  organizationId: z.string().optional(),
});

export const organizationSchema = z.object({
  __typename: z.literal('Organization').optional(),
  id: z.string(),
  ownerId: z.string(),
});

export const clientSchema = z.object({
  __typename: z.literal('Client').optional(),
  id: z.string(),
  organizationId: z.string(),
});

export const productSchema = z.object({
  __typename: z.literal('Product').optional(),
  id: z.string(),
  organizationId: z.string(),
});

export const billingSchema = z.object({
  __typename: z.literal('Billing').optional(),
  id: z.string(),
  organizationId: z.string(),
});

export type User = z.infer<typeof userSchema>;
export type Organization = z.infer<typeof organizationSchema>;
export type Client = z.infer<typeof clientSchema>;
export type Product = z.infer<typeof productSchema>;
export type Billing = z.infer<typeof billingSchema>;

export type AppSubject =
  | 'all'
  | 'User'
  | 'Organization'
  | 'Client'
  | 'Product'
  | 'Billing'
  | User
  | Organization
  | Client
  | Product
  | Billing;
