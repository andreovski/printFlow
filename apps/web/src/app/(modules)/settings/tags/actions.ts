'use server';

import { createTagBodySchema, updateTagBodySchema } from '@magic-system/schemas';
import { HTTPError } from 'ky';
import { revalidateTag } from 'next/cache';

import { createTag, updateTag, deleteTag } from '@/app/http/requests/tags';

export async function createTagAction(_prevState: any, formData: FormData) {
  const rawData = {
    name: formData.get('name') as string,
    color: formData.get('color') as string,
    scope: (formData.get('scope') as string) || 'GLOBAL',
  };

  const validation = createTagBodySchema.safeParse(rawData);

  if (!validation.success) {
    return {
      success: false,
      message: 'Erro de validação',
      errors: validation.error.flatten().fieldErrors,
    };
  }

  try {
    await createTag(validation.data);

    revalidateTag('tags');
    return { success: true, message: 'Tag criada com sucesso', errors: null };
  } catch (err) {
    if (err instanceof HTTPError) {
      let message = 'Falha ao criar tag.';
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

export async function updateTagAction(id: string, _prevState: any, formData: FormData) {
  const rawData = {
    name: formData.get('name') as string,
    color: formData.get('color') as string,
    scope: formData.get('scope') as string,
    active: formData.get('active') === 'true',
  };

  const validation = updateTagBodySchema.safeParse(rawData);

  if (!validation.success) {
    return {
      success: false,
      message: 'Erro de validação',
      errors: validation.error.flatten().fieldErrors,
    };
  }

  try {
    await updateTag({ id, ...validation.data });

    revalidateTag('tags');
    return { success: true, message: 'Tag atualizada com sucesso', errors: null };
  } catch (err) {
    if (err instanceof HTTPError) {
      let message = 'Falha ao atualizar tag.';
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

export async function deleteTagAction(id: string) {
  try {
    await deleteTag(id);
    revalidateTag('tags');
    return { success: true, message: 'Tag removida com sucesso', errors: null };
  } catch (err) {
    if (err instanceof HTTPError) {
      let message = 'Falha ao remover tag.';
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
