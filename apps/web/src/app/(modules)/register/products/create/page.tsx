import { PackagePlus } from 'lucide-react';

export const dynamic = 'force-dynamic';

import { ResponsiveDrawer } from '@/components/responsive-drawer';

import { ProductForm } from '../_components/product-form';

export default function CreateProductPage() {
  return (
    <ResponsiveDrawer
      title="Criar Produto"
      description="Preencha os dados abaixo para criar um novo produto."
      className="max-w-[900px] md:w-[60vw]"
      headerIcon={<PackagePlus className="w-5 h-5" />}
    >
      <ProductForm />
    </ResponsiveDrawer>
  );
}
