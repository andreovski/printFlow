import { CreateProductForm } from './_components/create-product-form';
import { ResponsiveDrawer } from '@/components/responsive-drawer';

export default function CreateProductPage() {
  return (
    <ResponsiveDrawer
      title="Criar Produto"
      description="Preencha os dados abaixo para criar um novo produto."
    >
      <div className="p-4 pb-0">
        <CreateProductForm />
      </div>
    </ResponsiveDrawer>
  );
}
