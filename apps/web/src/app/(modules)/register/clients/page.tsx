import { Suspense } from 'react';

import { ClientsContent } from './clients-content';

export default function ClientsPage() {
  return (
    <Suspense fallback={<div className="p-6">Carregando...</div>}>
      <ClientsContent />
    </Suspense>
  );
}
