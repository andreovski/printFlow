import { Plus } from 'lucide-react';
import { cookies } from 'next/headers';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';

import { columns, User } from './columns';

async function getUsers(): Promise<User[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    next: {
      tags: ['users'],
    },
  });

  if (!res.ok) {
    return [];
  }

  const response = await res.json();
  return response.data;
}

export default async function AccessesLayout({ children }: { children: React.ReactNode }) {
  const users = await getUsers();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Acessos</h1>
        <Button asChild>
          <Link href="/register/accesses/create">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Acesso
          </Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={users}
        searchKey="name"
        searchPlaceholder="Buscar por nome..."
      />
      {children}
    </div>
  );
}
