import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { columns, Product } from './columns';

async function getProducts(): Promise<Product[]> {
  const token = cookies().get('token')?.value;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    next: {
      tags: ['products'],
    },
  });

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  return data.products;
}

export default async function ProductsLayout({ children }: { children: React.ReactNode }) {
  const products = await getProducts();

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
        searchKey="name"
        searchPlaceholder="Buscar por nome..."
      />
      {children}
    </div>
  );
}
