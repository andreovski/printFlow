import { PencilRuler } from 'lucide-react';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

import { ResponsiveDrawer } from '@/components/responsive-drawer';

import { ProductForm } from '../../_components/product-form';

async function getProduct(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch product');
  }

  const data = await res.json();
  return data.product;
}

export default async function UpdateProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    throw new Error('Product not found');
  }

  return (
    <ResponsiveDrawer
      title="Atualizar Produto"
      description="Atualize os dados do produto abaixo."
      className="max-w-[900px] md:w-[60vw]"
      headerIcon={<PencilRuler className="w-5 h-5" />}
    >
      <ProductForm id={id} initialData={product} />
    </ResponsiveDrawer>
  );
}
