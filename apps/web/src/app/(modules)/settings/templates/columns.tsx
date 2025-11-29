'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pencil } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export type Template = {
  id: string;
  name: string;
  content: string;
  scope: 'GLOBAL' | 'BOARD' | 'BUDGET';
  active: boolean;
  createdAt: string;
};

const scopeLabels: Record<Template['scope'], string> = {
  GLOBAL: 'Global',
  BOARD: 'Produção',
  BUDGET: 'Orçamentos',
};

export const columns: ColumnDef<Template>[] = [
  {
    accessorKey: 'name',
    header: 'Nome',
    cell: ({ row }) => {
      return <span className="font-medium">{row.getValue('name')}</span>;
    },
  },
  {
    accessorKey: 'scope',
    header: 'Escopo',
    cell: ({ row }) => {
      const scope = row.getValue('scope') as Template['scope'];
      return <Badge variant="outline">{scopeLabels[scope]}</Badge>;
    },
  },
  {
    accessorKey: 'active',
    header: 'Status',
    cell: ({ row }) => {
      const active = row.getValue('active') as boolean;
      return (
        <Badge variant={active ? 'default' : 'secondary'}>{active ? 'Ativo' : 'Inativo'}</Badge>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Criado em',
    cell: ({ row }) => {
      const date = row.getValue('createdAt') as string;
      return (
        <span className="text-muted-foreground">
          {format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </span>
      );
    },
  },
  {
    id: 'actions',
    header: () => <div className="text-right">Ações</div>,
    cell: ({ row }) => {
      const template = row.original;

      return (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/settings/templates/update/${template.id}`}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </Button>
        </div>
      );
    },
  },
];
