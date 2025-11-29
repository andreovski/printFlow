import {
  CreateTemplateBody,
  CreateTemplateResponse,
  GetTemplateResponse,
  ListTemplatesResponse,
  TemplateScope,
  UpdateTemplateBody,
  UpdateTemplateResponse,
} from '@magic-system/schemas';

import { api } from '../api';

export async function createTemplate(data: CreateTemplateBody): Promise<CreateTemplateResponse> {
  return api.post('templates', { json: data }).json<CreateTemplateResponse>();
}

export async function getTemplates(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  scope?: TemplateScope;
  active?: boolean;
}): Promise<ListTemplatesResponse> {
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

  return api.get(`templates?${searchParams.toString()}`).json<ListTemplatesResponse>();
}

export async function getTemplate(id: string): Promise<GetTemplateResponse> {
  return api.get(`templates/${id}`).json<GetTemplateResponse>();
}

export async function updateTemplate(
  id: string,
  data: UpdateTemplateBody
): Promise<UpdateTemplateResponse> {
  return api.put(`templates/${id}`, { json: data }).json<UpdateTemplateResponse>();
}

export async function deleteTemplate(id: string): Promise<void> {
  return api.delete(`templates/${id}`).json<void>();
}
