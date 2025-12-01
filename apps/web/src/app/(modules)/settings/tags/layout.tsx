import { Plus } from 'lucide-react';
import { cookies } from 'next/headers';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';

import { columns, Tag } from './columns';

async function getTags(): Promise<Tag[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tags`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    next: {
      tags: ['tags'],
    },
  });

  if (!res.ok) {
    return [];
  }

  const response = await res.json();
  return response.data;
}

export default async function TagsLayout({ children }: { children: React.ReactNode }) {
  const tags = await getTags();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold">Etiquetas</h1>
          <p className="text-muted-foreground">
            Gerencie as etiquetas para classificar orçamentos e cards de produção
          </p>
        </div>
        <Button asChild>
          <Link href="/settings/tags/create">
            <Plus className="mr-2 h-4 w-4" />
            Criar Etiqueta
          </Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={tags}
        searchKey="name"
        searchPlaceholder="Buscar por nome..."
      />
      {children}
    </div>
  );
}
