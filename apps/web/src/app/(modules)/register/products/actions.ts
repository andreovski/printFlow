'use server';

import { redirect } from 'next/navigation';
import { revalidateTag } from 'next/cache';
import { HTTPError } from 'ky';
import { createProduct, updateProduct } from '@/app/http/requests/products';
import { CreateProductBody, UpdateProductBody } from '@magic-system/schemas';

export async function createProductAction(prevState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const price = Number(formData.get('price'));

  const data: CreateProductBody = {
    name,
    price,
  };

  try {
    await createProduct(data);

    revalidateTag('products');
  } catch (err) {
    if (err instanceof HTTPError) {
      const errorData = await err.response.json();
      return { error: errorData.message || 'Failed to create product' };
    }
    return { error: 'Something went wrong' };
  }

  redirect('/register/products');
}

export async function updateProductAction(id: string, prevState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const price = Number(formData.get('price'));

  const data: UpdateProductBody = {
    name,
    price,
  };

  try {
    await updateProduct({ id, ...data });

    revalidateTag('products');
  } catch (err) {
    if (err instanceof HTTPError) {
      const errorData = await err.response.json();
      return { error: errorData.message || 'Failed to update product' };
    }
    return { error: 'Something went wrong' };
  }

  redirect('/register/products');
}
