'use server';

import { createProductBodySchema, updateProductBodySchema } from '@magic-system/schemas';
import { HTTPError } from 'ky';
import { revalidateTag } from 'next/cache';

import { createProduct, updateProduct, deleteProduct } from '@/app/http/requests/products';

export async function createProductAction(_prevState: any, formData: FormData) {
  const cleanCurrency = (value: string | null) => {
    if (!value) return undefined;
    return Number(value.replace(/\D/g, '')) / 100;
  };
  const optionalString = (value: string | null) => (value ? value : undefined);

  const rawData = {
    title: formData.get('title') as string,
    description: optionalString(formData.get('description') as string),
    code: optionalString(formData.get('code') as string),
    unitType: formData.get('unitType') as 'M2' | 'UNIDADE',
    costPrice: cleanCurrency(formData.get('costPrice') as string),
    salePrice: cleanCurrency(formData.get('salePrice') as string),
    stock: Number(formData.get('stock')),
    category: (formData.get('category') as string)
      ?.split(',')
      .map((c) => c.trim())
      .filter(Boolean),
    active: formData.get('active') === 'true',
  };

  const validation = createProductBodySchema.safeParse(rawData);

  if (!validation.success) {
    return {
      success: false,
      message: 'Erro de validação',
      errors: validation.error.flatten().fieldErrors,
    };
  }

  try {
    await createProduct(validation.data);

    revalidateTag('products');
    return { success: true, message: 'Produto criado com sucesso', errors: null };
  } catch (err) {
    if (err instanceof HTTPError) {
      let message = 'Falha ao criar produto.';
      try {
        const errorData = await err.response.json();
        message = errorData.message || message;
      } catch (e) {
        console.error('Error parsing error response:', e);
      }
      return {
        success: false,
        message,
        errors: [],
      };
    }
    return { success: false, message: 'Algo deu errado', errors: null };
  }
}

export async function updateProductAction(id: string, _prevState: any, formData: FormData) {
  const cleanCurrency = (value: string | null) => {
    if (!value) return undefined;
    return Number(value.replace(/\D/g, '')) / 100;
  };
  const optionalString = (value: string | null) => (value ? value : undefined);

  const rawData = {
    title: formData.get('title') as string,
    description: optionalString(formData.get('description') as string),
    code: optionalString(formData.get('code') as string),
    unitType: formData.get('unitType') as 'M2' | 'UNIDADE',
    costPrice: cleanCurrency(formData.get('costPrice') as string),
    salePrice: cleanCurrency(formData.get('salePrice') as string),
    stock: Number(formData.get('stock')),
    category: (formData.get('category') as string)
      ?.split(',')
      .map((c) => c.trim())
      .filter(Boolean),
    active: formData.get('active') === 'true',
  };

  const validation = updateProductBodySchema.safeParse(rawData);

  if (!validation.success) {
    return {
      success: false,
      message: 'Erro de validação',
      errors: validation.error.flatten().fieldErrors,
    };
  }

  try {
    await updateProduct({ id, ...validation.data });

    revalidateTag('products');
    return { success: true, message: 'Produto atualizado com sucesso', errors: null };
  } catch (err) {
    if (err instanceof HTTPError) {
      let message = 'Falha ao atualizar produto.';
      try {
        const errorData = await err.response.json();
        message = errorData.message || message;
      } catch (e) {
        console.error('Error parsing error response:', e);
      }
      return {
        success: false,
        message,
        errors: null,
      };
    }
    return { success: false, message: 'Algo deu errado', errors: null };
  }
}

export async function deleteProductAction(id: string) {
  try {
    await deleteProduct(id);
    revalidateTag('products');
    return { success: true, message: 'Produto removido com sucesso', errors: null };
  } catch (err) {
    if (err instanceof HTTPError) {
      let message = 'Falha ao remover produto.';
      try {
        const errorData = await err.response.json();
        message = errorData.message || message;
      } catch (e) {
        console.error('Error parsing error response:', e);
      }
      return {
        success: false,
        message,
        errors: null,
      };
    }
    return { success: false, message: 'Algo deu errado', errors: null };
  }
}
