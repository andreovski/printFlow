import { Suspense } from 'react';

import { AccessesContent } from './accesses-content';
import AccessesLoading from './loading';

export default function AccessesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<AccessesLoading />}>
        <AccessesContent />
      </Suspense>
      <Suspense fallback={<AccessesLoading />}>{children}</Suspense>
    </>
  );
}
