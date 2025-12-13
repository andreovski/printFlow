import { Suspense } from 'react';

import { BudgetsContent } from './budgets-content';

export default function BudgetsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-6">Carregando...</div>}>
      <BudgetsContent />
      {children}
    </Suspense>
  );
}
