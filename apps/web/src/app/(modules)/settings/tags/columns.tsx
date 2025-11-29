'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Pencil } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export type Tag = {
  id: string;
  name: string;
  color: string;
  scope: 'GLOBAL' | 'BUDGET' | 'BOARD';
  active: boolean;
};

const scopeLabels: Record<Tag['scope'], string> = {
  GLOBAL: 'Global',
  BUDGET: 'Orçamentos',
  BOARD: 'Produção',
};

export const columns: ColumnDef<Tag>[] = [
  {
    accessorKey: 'name',
    header: 'Nome',
    cell: ({ row }) => {
      const color = row.original.color;
      return (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: color }} />
          <span className="font-medium">{row.getValue('name')}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'color',
    header: 'Cor',
    cell: ({ row }) => (
      <code
        className={`text-xs px-2 py-1 rounded`}
        style={{ backgroundColor: row.getValue('color') }}
      >
        {row.getValue('color')}
      </code>
    ),
  },
  {
    accessorKey: 'scope',
    header: 'Escopo',
    cell: ({ row }) => {
      const scope = row.getValue('scope') as Tag['scope'];
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
    id: 'actions',
    header: () => <div className="text-right">Ações</div>,
    cell: ({ row }) => {
      const tag = row.original;

      return (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/settings/tags/update/${tag.id}`}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </Button>
        </div>
      );
    },
  },
];
