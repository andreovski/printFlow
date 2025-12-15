import { Suspense } from 'react';

import { ClientsContent } from './clients-content';
import ClientsLoading from './loading';

export default function ClientsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<ClientsLoading />}>
        <ClientsContent />
      </Suspense>
      <Suspense fallback={<ClientsLoading />}>{children}</Suspense>
    </>
  );
}
