import { FilePen } from 'lucide-react';

import { getBudget } from '@/app/http/requests/budgets';
import { ResponsiveDrawer } from '@/components/responsive-drawer';

import { BudgetForm } from '../_components/budget-form';

export default async function EditBudgetPage({ params }: { params: { id: string } }) {
  const data = await getBudget(params.id);
  const budget = data?.budget;

  if (!budget) return <div>Orçamento não encontrado</div>;

  return (
    <ResponsiveDrawer
      title={`Editar Orçamento #${budget.code}`}
      description="Edite os detalhes do orçamento."
      className="max-w-[1200px] md:w-[80vw]"
      headerIcon={<FilePen />}
      redirectTo="/finance/budgets"
    >
      <BudgetForm initialData={budget} />
    </ResponsiveDrawer>
  );
}
