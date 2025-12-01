import { z } from 'zod';

export const createClientBodySchema = z.object({
  name: z.string({ required_error: 'Nome é obrigatório' }).min(1, 'Nome é obrigatório'),
  fantasyName: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  personType: z.enum(['FISICA', 'JURIDICA', 'ESTRANGEIRO'], {
    required_error: 'Tipo de pessoa é obrigatório',
  }),
  document: z
    .string({ required_error: 'Documento é obrigatório' })
    .min(1, 'Documento é obrigatório'),
  stateRegistration: z.string().optional(),
  phone: z.string({ required_error: 'Telefone é obrigatório' }).min(1, 'Telefone é obrigatório'),
  isWhatsapp: z.boolean().optional().default(false),
  rg: z.string().optional(),
  cep: z.string({ required_error: 'CEP é obrigatório' }).min(1, 'CEP é obrigatório'),
  addressType: z.enum(['COMERCIAL', 'RESIDENCIAL']).optional(),
  address: z.string({ required_error: 'Endereço é obrigatório' }).min(1, 'Endereço é obrigatório'),
  addressNumber: z
    .string({ required_error: 'Número é obrigatório' })
    .min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string({ required_error: 'Cidade é obrigatória' }).min(1, 'Cidade é obrigatória'),
  state: z.string({ required_error: 'Estado é obrigatório' }).min(1, 'Estado é obrigatório'),
  country: z.string().default('Brasil'),
  notes: z.string().optional(),
  active: z.boolean().optional().default(true),
});

export const getClientParamsSchema = z.object({
  id: z.string().uuid(),
});

export const updateClientParamsSchema = z.object({
  id: z.string().uuid(),
});

export const updateClientBodySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  fantasyName: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  personType: z.enum(['FISICA', 'JURIDICA', 'ESTRANGEIRO']).optional(),
  document: z.string().min(1, 'Documento é obrigatório').optional(),
  stateRegistration: z.string().optional(),
  phone: z.string().min(1, 'Telefone é obrigatório').optional(),
  isWhatsapp: z.boolean().optional(),
  rg: z.string().optional(),
  cep: z.string().min(1, 'CEP é obrigatório').optional(),
  addressType: z.enum(['COMERCIAL', 'RESIDENCIAL']).optional(),
  address: z.string().min(1, 'Endereço é obrigatório').optional(),
  addressNumber: z.string().min(1, 'Número é obrigatório').optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().min(1, 'Cidade é obrigatória').optional(),
  state: z.string().min(1, 'Estado é obrigatório').optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
  active: z.boolean().optional(),
});

export type CreateClientBody = z.infer<typeof createClientBodySchema>;
export type GetClientParams = z.infer<typeof getClientParamsSchema>;
export type UpdateClientParams = z.infer<typeof updateClientParamsSchema>;
export type UpdateClientBody = z.infer<typeof updateClientBodySchema>;

// Entity type
export interface Client {
  id: string;
  name: string;
  fantasyName: string | null;
  email: string | null;
  personType: 'FISICA' | 'JURIDICA' | 'ESTRANGEIRO';
  document: string;
  stateRegistration: string | null;
  phone: string;
  isWhatsapp: boolean;
  rg: string | null;
  cep: string;
  addressType: 'COMERCIAL' | 'RESIDENCIAL' | null;
  address: string;
  addressNumber: string;
  complement: string | null;
  neighborhood: string | null;
  city: string;
  state: string;
  country: string;
  notes: string | null;
  active: boolean;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Response types
export interface CreateClientResponse {
  client: Client;
}

export interface GetClientResponse {
  client: Client;
}

export interface UpdateClientResponse {
  client: Client;
}
