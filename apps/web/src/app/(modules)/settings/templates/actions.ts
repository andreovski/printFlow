'use server';

import { createTemplateBodySchema, updateTemplateBodySchema } from '@magic-system/schemas';
import { HTTPError } from 'ky';
import { revalidateTag } from 'next/cache';

import { createTemplate, deleteTemplate, updateTemplate } from '@/app/http/requests/templates';

export async function createTemplateAction(_prevState: any, formData: FormData) {
  const rawData = {
    name: formData.get('name') as string,
    content: formData.get('content') as string,
    scope: (formData.get('scope') as string) || 'GLOBAL',
  };

  const validation = createTemplateBodySchema.safeParse(rawData);

  if (!validation.success) {
    return {
      success: false,
      message: 'Erro de validação',
      errors: validation.error.flatten().fieldErrors,
    };
  }

  try {
    await createTemplate(validation.data);

    revalidateTag('templates');
    return { success: true, message: 'Template criado com sucesso', errors: null };
  } catch (err) {
    if (err instanceof HTTPError) {
      let message = 'Falha ao criar template.';
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

export async function updateTemplateAction(id: string, _prevState: any, formData: FormData) {
  const rawData = {
    name: formData.get('name') as string,
    content: formData.get('content') as string,
    scope: formData.get('scope') as string,
    active: formData.get('active') === 'true',
  };

  const validation = updateTemplateBodySchema.safeParse(rawData);

  if (!validation.success) {
    return {
      success: false,
      message: 'Erro de validação',
      errors: validation.error.flatten().fieldErrors,
    };
  }

  try {
    await updateTemplate(id, validation.data);

    revalidateTag('templates');
    return { success: true, message: 'Template atualizado com sucesso', errors: null };
  } catch (err) {
    if (err instanceof HTTPError) {
      let message = 'Falha ao atualizar template.';
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

export async function deleteTemplateAction(id: string) {
  try {
    await deleteTemplate(id);
    revalidateTag('templates');
    return { success: true, message: 'Template removido com sucesso', errors: null };
  } catch (err) {
    if (err instanceof HTTPError) {
      let message = 'Falha ao remover template.';
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
