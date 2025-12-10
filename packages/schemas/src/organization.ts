import { z } from 'zod';

// CNPJ validation function
function isValidCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/\D/g, '');

  if (cleanCNPJ.length !== 14) return false;

  // Check if all digits are the same
  if (/^(\d)\1+$/.test(cleanCNPJ)) return false;

  // Validate check digits
  const calcDigit = (base: string, weights: number[]): number => {
    const sum = base.split('').reduce((acc, digit, idx) => {
      return acc + parseInt(digit) * weights[idx];
    }, 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const digit1 = calcDigit(cleanCNPJ.slice(0, 12), weights1);
  const digit2 = calcDigit(cleanCNPJ.slice(0, 12) + digit1, weights2);

  return cleanCNPJ.slice(12) === `${digit1}${digit2}`;
}

export const organizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  ownerId: z.string(),
  budgetAutoInactive: z.boolean().optional(),
  budgetAutoArchive: z.boolean().optional(),
  budgetShowTotalInKanban: z.boolean().optional(),
  // Company Information
  cnpj: z.string().optional().nullable(),
  enterpriseName: z.string().optional().nullable(),
  fantasyName: z.string().optional().nullable(),
  mainEmail: z.string().optional().nullable(),
  mainPhone: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  // Address
  cep: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  addressNumber: z.string().optional().nullable(),
  complement: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
});

export type Organization = z.infer<typeof organizationSchema>;

// Schema for updating company settings (form validation - all required)
export const updateCompanySettingsBodySchema = z.object({
  cnpj: z
    .string({ required_error: 'CNPJ é obrigatório' })
    .min(1, 'CNPJ é obrigatório')
    .refine((val) => isValidCNPJ(val), { message: 'CNPJ inválido' }),
  enterpriseName: z
    .string({ required_error: 'Razão Social é obrigatória' })
    .min(1, 'Razão Social é obrigatória'),
  fantasyName: z
    .string({ required_error: 'Nome Fantasia é obrigatório' })
    .min(1, 'Nome Fantasia é obrigatório'),
  mainEmail: z
    .string({ required_error: 'Email é obrigatório' })
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  mainPhone: z
    .string({ required_error: 'Telefone é obrigatório' })
    .min(1, 'Telefone é obrigatório'),
  logoUrl: z.string().optional(),
  cep: z.string({ required_error: 'CEP é obrigatório' }).min(1, 'CEP é obrigatório'),
  address: z.string({ required_error: 'Endereço é obrigatório' }).min(1, 'Endereço é obrigatório'),
  addressNumber: z
    .string({ required_error: 'Número é obrigatório' })
    .min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string({ required_error: 'Cidade é obrigatória' }).min(1, 'Cidade é obrigatória'),
  state: z.string({ required_error: 'Estado é obrigatório' }).min(1, 'Estado é obrigatório'),
  country: z.string().default('Brasil'),
});

export type UpdateCompanySettingsBody = z.infer<typeof updateCompanySettingsBodySchema>;

// Schema for creating organization during registration
export const createOrganizationBodySchema = z.object({
  name: z.string().min(1, 'Nome da organização é obrigatório'),
  cnpj: z.string().optional(),
  enterpriseName: z.string().optional(),
  mainEmail: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
  mainPhone: z.string().min(1, 'Telefone é obrigatório'),
  logoUrl: z.string().optional(),
  cep: z.string().min(1, 'CEP é obrigatório'),
  address: z.string().min(1, 'Endereço é obrigatório'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().min(1, 'Estado é obrigatório'),
  country: z.string().default('Brasil'),
});

export type CreateOrganizationBody = z.infer<typeof createOrganizationBodySchema>;
