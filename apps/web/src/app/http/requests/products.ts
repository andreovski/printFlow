import {
  CreateProductBody,
  UpdateProductBody,
  UpdateProductParams,
  CreateProductResponse,
  GetProductResponse,
  UpdateProductResponse,
  Product,
  PaginatedResponse,
} from '@magic-system/schemas';

import { api } from '../api';

export async function createProduct(data: CreateProductBody): Promise<CreateProductResponse> {
  return api.post('products', { json: data }).json<CreateProductResponse>();
}

export async function getProducts(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<PaginatedResponse<Product>> {
  const searchParams = new URLSearchParams({
    page: String(params?.page || 1),
    pageSize: String(params?.pageSize || 10),
  });

  if (params?.search) {
    searchParams.append('search', params.search);
  }

  return api.get(`products?${searchParams.toString()}`).json<PaginatedResponse<Product>>();
}

export async function getProduct(id: string): Promise<GetProductResponse> {
  return api.get(`products/${id}`).json<GetProductResponse>();
}

export async function updateProduct({
  id,
  ...data
}: UpdateProductParams & UpdateProductBody): Promise<UpdateProductResponse> {
  return api.put(`products/${id}`, { json: data }).json<UpdateProductResponse>();
}

export async function deleteProduct(id: string): Promise<void> {
  return api.delete(`products/${id}`).json<void>();
}
