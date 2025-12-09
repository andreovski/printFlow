'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Pencil } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

import type { Product } from '@magic-system/schemas';

export type { Product };

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: 'title',
    header: 'Título',
    cell: ({ row }) => <div className="font-medium">{row.getValue('title')}</div>,
  },
  {
    accessorKey: 'code',
    header: 'Código',
    cell: ({ row }) => <div>{row.getValue('code') || '-'}</div>,
  },
  {
    accessorKey: 'unitType',
    header: 'Unidade',
    cell: ({ row }) => <div>{row.getValue('unitType')}</div>,
  },
  {
    accessorKey: 'stock',
    header: 'Estoque',
    cell: ({ row }) => <div>{row.getValue('stock')}</div>,
  },
  {
    accessorKey: 'category',
    header: 'Categoria',
    cell: ({ row }) => {
      const categories = row.getValue('category') as string[] | undefined;
      return <div>{categories?.join(', ') || '-'}</div>;
    },
  },
  {
    id: 'actions',
    header: () => <div className="text-right">Ações</div>,
    cell: ({ row }) => {
      const product = row.original;

      return (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/register/products/update/${product.id}`}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </Button>
        </div>
      );
    },
  },
];
