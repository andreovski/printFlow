import { FilePlus } from 'lucide-react';

import { ResponsiveDrawer } from '@/components/responsive-drawer';

import { BudgetForm } from '../_components/budget-form';

export default function CreateBudgetPage() {
  return (
    <ResponsiveDrawer
      title="Novo Orçamento"
      description="Crie um novo orçamento para um cliente."
      className="max-w-[1200px] md:w-[80vw]"
      headerIcon={<FilePlus />}
      redirectTo="/finance/budgets"
    >
      <BudgetForm />
    </ResponsiveDrawer>
  );
}
