import { cookies } from 'next/headers';
import { UpdateProductForm } from './_components/update-product-form';
import { ResponsiveDrawer } from '@/components/responsive-drawer';

async function getProduct(id: string) {
  const token = cookies().get('token')?.value;
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

export default async function UpdateProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);

  return (
    <ResponsiveDrawer title="Atualizar Produto" description="Atualize os dados do produto abaixo.">
      <div className="p-4 pb-0">
        <UpdateProductForm id={params.id} initialData={product} />
      </div>
    </ResponsiveDrawer>
  );
}
