import { Suspense } from 'react';

import { BudgetsContent } from './budgets-content';
import BudgetsLoading from './loading';

export default function BudgetsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<BudgetsLoading />}>
        <BudgetsContent />
      </Suspense>
      <Suspense fallback={<BudgetsLoading />}>{children}</Suspense>
    </>
  );
}
