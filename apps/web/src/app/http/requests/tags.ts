import {
  CreateTagBody,
  UpdateTagBody,
  UpdateTagParams,
  Tag,
  TagScope,
} from '@magic-system/schemas';

import { api } from '../api';

export interface CreateTagResponse {
  tag: Tag;
}

export interface GetTagResponse {
  tag: Tag;
}

export interface UpdateTagResponse {
  tag: Tag;
}

export interface ListTagsResponse {
  data: Tag[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export async function createTag(data: CreateTagBody): Promise<CreateTagResponse> {
  return api.post('tags', { json: data }).json<CreateTagResponse>();
}

export async function getTags(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  scope?: TagScope;
  active?: boolean;
}): Promise<ListTagsResponse> {
  const searchParams = new URLSearchParams({
    page: String(params?.page || 1),
    pageSize: String(params?.pageSize || 10),
  });

  if (params?.search) {
    searchParams.append('search', params.search);
  }

  if (params?.scope) {
    searchParams.append('scope', params.scope);
  }

  if (params?.active !== undefined) {
    searchParams.append('active', String(params.active));
  }

  return api.get(`tags?${searchParams.toString()}`).json<ListTagsResponse>();
}

export async function getTag(id: string): Promise<GetTagResponse> {
  return api.get(`tags/${id}`).json<GetTagResponse>();
}

export async function updateTag({
  id,
  ...data
}: UpdateTagParams & UpdateTagBody): Promise<UpdateTagResponse> {
  return api.put(`tags/${id}`, { json: data }).json<UpdateTagResponse>();
}

export async function deleteTag(id: string): Promise<void> {
  await api.delete(`tags/${id}`);
}
