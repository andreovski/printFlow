'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { formatDocument, formatPhone } from '@/lib/masks';

export type Client = {
  id: string;
  name: string;
  fantasyName: string | null;
  email: string | null;
  document: string;
  phone: string;
  personType: string;
};

export const columns: ColumnDef<Client>[] = [
  {
    accessorKey: 'name',
    header: 'Nome',
    cell: ({ row }) => {
      const name = row.original.name;
      const fantasyName = row.original.fantasyName;
      return <div className="font-medium">{fantasyName || name}</div>;
    },
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => <div>{row.getValue('email') || '-'}</div>,
  },
  {
    accessorKey: 'phone',
    header: 'Telefone',
    cell: ({ row }) => <div>{formatPhone(row.getValue('phone'))}</div>,
  },
  {
    accessorKey: 'document',
    header: 'Documento',
    cell: ({ row }) => <div>{formatDocument(row.getValue('document'))}</div>,
  },
  {
    id: 'actions',
    header: () => <div className="text-right">Ações</div>,
    cell: ({ row }) => {
      const client = row.original;

      return (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/register/clients/update/${client.id}`}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </Button>
        </div>
      );
    },
  },
];
