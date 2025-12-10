import type { Product } from '@magic-system/schemas';

export const dynamic = 'force-dynamic';

import { Plus } from 'lucide-react';
import Link from 'next/link';

import { getProducts } from '@/app/http/requests/products';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';

import { columns } from './columns';

async function fetchProducts(): Promise<Product[]> {
  try {
    const response = await getProducts({ page: 1, pageSize: 100 });
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export default async function ProductsLayout({ children }: { children: React.ReactNode }) {
  const products = await fetchProducts();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Produtos</h1>
        <Button asChild>
          <Link href="/register/products/create">
            <Plus className="mr-2 h-4 w-4" />
            Criar Produto
          </Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={products}
        searchKey="title"
        searchPlaceholder="Buscar por título..."
      />
      {children}
    </div>
  );
}
