import { Suspense } from 'react';

import TemplatesLoading from './loading';
import { TemplatesContent } from './templates-content';

export default function TemplatesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<TemplatesLoading />}>
        <TemplatesContent />
      </Suspense>
      <Suspense fallback={<TemplatesLoading />}>{children}</Suspense>
    </>
  );
}
