import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';

import { SalesMovementContent } from './sales-movement-content';

export default function SalesMovementPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Movimentação de Vendas</h1>
        <p className="text-muted-foreground mt-1">
          Acompanhe o faturamento, custos e lucro dos orçamentos aprovados
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <SalesMovementContent />
      </Suspense>
    </div>
  );
}
