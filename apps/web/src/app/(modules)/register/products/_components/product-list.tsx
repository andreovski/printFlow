'use client';

interface Product {
  id: string;
  name: string;
  price: number;
}

export function ProductList({ products }: { products: Product[] }) {
  return (
    <div className="border rounded-lg">
      <table className="w-full text-sm text-left">
        <thead className="bg-muted/50 text-muted-foreground uppercase">
          <tr>
            <th className="px-6 py-3">Nome</th>
            <th className="px-6 py-3">Preço</th>
            <th className="px-6 py-3">Ações</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-b last:border-0 hover:bg-muted/50">
              <td className="px-6 py-4 font-medium">{product.name}</td>
              <td className="px-6 py-4">R$ {product.price}</td>
              <td className="px-6 py-4">
                <a
                  href={`/register/products/update/${product.id}`}
                  className="text-blue-600 hover:underline"
                >
                  Editar
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
