import { FilePlus } from 'lucide-react';
import { cookies } from 'next/headers';
import Link from 'next/link';

import { getBudgets } from '@/app/http/requests/budgets';
import { getOrganization } from '@/app/http/requests/organization';
import { Button } from '@/components/ui/button';

import { ArchivedBudgetsDialog } from './_components/archived-budgets-dialog';
import { BudgetSettingsDialog } from './_components/budget-settings-dialog';
import { BudgetsContent } from './budgets-content';

async function fetchBudgets() {
  return getBudgets({ page: 1, pageSize: 100 });
}

async function fetchOrganization() {
  try {
    return await getOrganization();
  } catch (_error) {
    return { organization: null };
  }
}

export default async function BudgetsLayout({ children }: { children: React.ReactNode }) {
  const { data } = await fetchBudgets();
  const { organization } = await fetchOrganization();

  // Get user role from token
  const token = (await cookies()).get('token')?.value;
  let userRole = '';
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userRole = payload.role;
    } catch (_e) {
      // Ignore invalid token
    }
  }

  const isAdmin = userRole === 'ADMIN' || userRole === 'MASTER';

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Orçamentos</h1>
        <div className="flex items-center gap-2">
          <ArchivedBudgetsDialog />
          {isAdmin && <BudgetSettingsDialog organization={organization} />}
          <Button asChild>
            <Link href="/finance/budgets/create">
              <FilePlus className="mr-2 h-4 w-4" />
              Novo Orçamento
            </Link>
          </Button>
        </div>
      </div>

      <BudgetsContent budgets={(data as any) || []} />
      {children}
    </div>
  );
}
