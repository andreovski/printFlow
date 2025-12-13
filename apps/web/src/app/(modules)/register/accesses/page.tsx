import { Suspense } from 'react';

import { AccessesContent } from './accesses-content';

export default function AccessesPage() {
  return (
    <Suspense fallback={<div className="p-6">Carregando...</div>}>
      <AccessesContent />
    </Suspense>
  );
}
