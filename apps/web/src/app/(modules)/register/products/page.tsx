import { Suspense } from 'react';

import { ProductsContent } from './products-content';

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-6">Carregando...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
