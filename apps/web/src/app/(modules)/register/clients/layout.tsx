import Link from 'next/link';
import { cookies } from 'next/headers';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { columns, Client } from './columns';

async function getClients(): Promise<Client[]> {
  const token = cookies().get('token')?.value;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    next: {
      tags: ['clients'],
    },
  });

  if (!res.ok) {
    return [];
  }

  const { clients } = await res.json();
  return clients;
}

export default async function ClientsLayout({ children }: { children: React.ReactNode }) {
  const clients = await getClients();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Clientes</h1>
        <Button asChild>
          <Link href="/register/clients/create">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Cliente
          </Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={clients}
        searchKey="name"
        searchPlaceholder="Buscar por nome..."
      />
      {children}
    </div>
  );
}
