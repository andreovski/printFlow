'use client';

import {
  Budget,
  BudgetStatus,
  budgetStatusLabel,
  PaymentType,
  paymentTypeLabel,
} from '@magic-system/schemas';
import { ColumnDef } from '@tanstack/react-table';
import { Pencil } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

import { StatusBulletColor } from './_components/status-select';

const getStatus = (status: string) => {
  return budgetStatusLabel[status as BudgetStatus];
};

export const columns: ColumnDef<Budget>[] = [
  {
    accessorKey: 'code',
    header: 'Código',
    cell: ({ row }) => <div>#{row.getValue('code')}</div>,
  },
  {
    accessorFn: (row) => row.client?.name,
    id: 'client.name',
    header: 'Cliente',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <div>
        <span
          className={`inline-block w-2 h-2 rounded-full mr-2 ${StatusBulletColor[row.getValue('status') as BudgetStatus]}`}
        ></span>
        {getStatus(row.getValue('status'))}
      </div>
    ),
  },
  {
    accessorKey: 'total',
    header: 'Total',
    cell: ({ row }) => {
      const amount = row.getValue('total') as number;
      const formatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(amount);
      return <div>{formatted}</div>;
    },
  },
  {
    accessorKey: 'paymentType',
    header: 'Pagamento',
    cell: ({ row }) => {
      const paymentType = row.getValue('paymentType') as PaymentType | null;
      return <div>{paymentType ? paymentTypeLabel[paymentType] : '-'}</div>;
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Data',
    cell: ({ row }) => {
      const dateValue = row.getValue('createdAt');
      const date = new Date(dateValue as string | Date);
      return <div>{date.toLocaleDateString('pt-BR')}</div>;
    },
  },
  {
    id: 'actions',
    header: () => <div className="text-right">Ações</div>,
    cell: ({ row }) => {
      const budget = row.original;

      return (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/finance/budgets/${budget.id}`}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </Button>
        </div>
      );
    },
  },
];
