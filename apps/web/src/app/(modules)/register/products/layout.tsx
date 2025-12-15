import { Suspense } from 'react';

import ProductsLoading from './loading';
import { ProductsContent } from './products-content';

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<ProductsLoading />}>
        <ProductsContent />
      </Suspense>
      <Suspense fallback={<ProductsLoading />}>{children}</Suspense>
    </>
  );
}
