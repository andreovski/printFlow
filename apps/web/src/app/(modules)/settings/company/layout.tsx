import { Organization } from '@magic-system/schemas';
import { Building2 } from 'lucide-react';
import { cookies } from 'next/headers';

import { CompanyForm } from './_components/company-form';

async function getOrganization(): Promise<Organization | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organization`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    next: {
      tags: ['organization'],
    },
  });

  if (!res.ok) {
    return null;
  }

  const response = await res.json();
  return response.organization;
}

export default async function CompanyLayout({ children }: { children: React.ReactNode }) {
  const organization = await getOrganization();

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2 px-4 py-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="w-8 h-8" />
            Dados da Empresa
          </h1>
          <p className="text-muted-foreground">
            Configure as informações principais da sua empresa
          </p>
        </div>
      </div>

      <div className="overflow-hidden">
        <CompanyForm initialData={organization} />
      </div>
      {children}
    </div>
  );
}
