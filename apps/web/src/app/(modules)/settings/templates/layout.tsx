import { FileText, Plus } from 'lucide-react';
import { cookies } from 'next/headers';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';

import { columns, Template } from './columns';

async function getTemplates(): Promise<Template[]> {
  const token = cookies().get('token')?.value;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/templates`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    next: {
      tags: ['templates'],
    },
  });

  if (!res.ok) {
    return [];
  }

  const response = await res.json();
  return response.data;
}

export default async function TemplatesLayout({ children }: { children: React.ReactNode }) {
  const templates = await getTemplates();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="w-8 h-8" />
            Templates
          </h1>
          <p className="text-muted-foreground">
            Gerencie os templates de texto utilizados no sistema
          </p>
        </div>
        <Button asChild>
          <Link href="/settings/templates/create">
            <Plus className="mr-2 h-4 w-4" />
            Criar Template
          </Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={templates}
        searchKey="name"
        searchPlaceholder="Buscar por nome..."
      />
      {children}
    </div>
  );
}
