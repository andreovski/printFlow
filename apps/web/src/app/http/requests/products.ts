import { CreateProductBody, UpdateProductBody, UpdateProductParams } from '@magic-system/schemas';

import { api } from '../api';

export async function createProduct(data: CreateProductBody) {
  return api.post('products', { json: data }).json();
}

export async function getProducts() {
  return api.get('products').json();
}

export async function getProduct(id: string) {
  return api.get(`products/${id}`).json();
}

export async function updateProduct({ id, ...data }: UpdateProductParams & UpdateProductBody) {
  return api.put(`products/${id}`, { json: data }).json();
}

export async function deleteProduct(id: string) {
  return api.delete(`products/${id}`);
}
