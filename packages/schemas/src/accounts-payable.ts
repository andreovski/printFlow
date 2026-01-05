import { z } from 'zod';

// Enum para status de conta a pagar
export const accountsPayableStatusSchema = z.enum(['PENDING', 'PAID', 'OVERDUE']);

export type AccountsPayableStatus = z.infer<typeof accountsPayableStatusSchema>;

// Labels em português para os status
export const accountsPayableStatusLabel: Record<AccountsPayableStatus, string> = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  OVERDUE: 'Atrasado',
};

// Schema de criação de conta a pagar
export const createAccountsPayableSchema = z
  .object({
    supplier: z.string().min(1, 'Fornecedor é obrigatório'),
    icon: z.string().min(1, 'Ícone é obrigatório').default('Ellipsis'),
    dueDate: z.coerce.date({
      required_error: 'Data de vencimento é obrigatória',
      invalid_type_error: 'Data de vencimento inválida',
    }),
    amount: z.coerce
      .number({
        required_error: 'Valor é obrigatório',
        invalid_type_error: 'Valor deve ser um número',
      })
      .positive('Valor deve ser maior que zero'),
    status: accountsPayableStatusSchema.default('PENDING'),
    installments: z.coerce
      .number()
      .int('Parcelas deve ser um número inteiro')
      .min(1, 'Mínimo de 1 parcela')
      .max(99, 'Máximo de 99 parcelas')
      .default(1),
    tagIds: z.array(z.string().uuid()).optional(),
    description: z.string().optional().nullable(),
    paidDate: z.coerce.date().optional().nullable(),
  })
  .refine(
    (data) => {
      // Se status for PAID, paidDate é obrigatório
      if (data.status === 'PAID') {
        return data.paidDate != null;
      }
      return true;
    },
    {
      message: 'Data de pagamento é obrigatória quando o status é "Pago"',
      path: ['paidDate'],
    }
  );

// Schema de atualização (sem installments que não pode ser alterado)
export const updateAccountsPayableSchema = z
  .object({
    supplier: z.string().min(1, 'Fornecedor é obrigatório'),
    icon: z.string().min(1, 'Ícone é obrigatório').default('Ellipsis'),
    dueDate: z.coerce.date({
      required_error: 'Data de vencimento é obrigatória',
      invalid_type_error: 'Data de vencimento inválida',
    }),
    amount: z.coerce
      .number({
        required_error: 'Valor é obrigatório',
        invalid_type_error: 'Valor deve ser um número',
      })
      .positive('Valor deve ser maior que zero'),
    status: accountsPayableStatusSchema.default('PENDING'),
    tagIds: z.array(z.string().uuid()).optional(),
    description: z.string().optional().nullable(),
    paidDate: z.coerce.date().optional().nullable(),
  })
  .refine(
    (data) => {
      // Se status for PAID, paidDate é obrigatório
      if (data.status === 'PAID') {
        return data.paidDate != null;
      }
      return true;
    },
    {
      message: 'Data de pagamento é obrigatória quando o status é "Pago"',
      path: ['paidDate'],
    }
  );

// Schema de filtros para listagem
export const accountsPayableFiltersSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  search: z.string().optional(),
  status: accountsPayableStatusSchema.optional(),
});

// Types exportados
export type CreateAccountsPayableBody = z.infer<typeof createAccountsPayableSchema>;
export type UpdateAccountsPayableBody = z.infer<typeof updateAccountsPayableSchema>;
export type AccountsPayableFilters = z.infer<typeof accountsPayableFiltersSchema>;

// Response Types (para o frontend)
export interface AccountsPayable {
  id: string;
  supplier: string;
  icon: string | null;
  dueDate: string;
  amount: number;
  status: AccountsPayableStatus;
  installments: number;
  totalAmount: number;
  parentId?: string | null;
  installmentNumber?: number | null;
  installmentOf?: number | null;
  description: string | null;
  paidDate: string | null;
  tags?: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AccountsPayableWithRelations extends AccountsPayable {
  parent?: AccountsPayable | null;
  children?: AccountsPayable[];
}

export interface DeleteAccountsPayableInfo {
  isParent: boolean;
  hasChildren: boolean;
  childrenCount: number;
  siblingIds: string[];
}

export interface AccountsPayableKPIs {
  totalToPay: number;
  totalPaid: number;
  totalPending: number;
}
