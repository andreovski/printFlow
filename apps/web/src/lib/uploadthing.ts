import { cookies } from 'next/headers';
import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { UTFiles } from 'uploadthing/server';

const f = createUploadthing();

// Função para obter o usuário autenticado
async function getAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    throw new Error('Não autorizado');
  }

  // Decodificar o JWT para obter o organizationId
  // O token JWT contém: { sub: userId, organizationId: string }
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return {
      userId: payload.sub,
      organizationId: payload.organizationId,
    };
  } catch (_error) {
    throw new Error('Token inválido');
  }
}

// FileRouter para o UploadThing
export const uploadRouter = {
  // Upload para anexos de Budget
  budgetAttachment: f({
    image: { maxFileSize: '32MB', maxFileCount: 5 },
    pdf: { maxFileSize: '32MB', maxFileCount: 5 },
    'application/msword': { maxFileSize: '32MB', maxFileCount: 5 },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
      maxFileSize: '32MB',
      maxFileCount: 5,
    },
    'application/vnd.ms-excel': { maxFileSize: '32MB', maxFileCount: 5 },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
      maxFileSize: '32MB',
      maxFileCount: 5,
    },
    blob: { maxFileSize: '32MB', maxFileCount: 5 },
  })
    .middleware(async ({ files }) => {
      const auth = await getAuth();

      const fileOverrides = files.map((file) => ({
        ...file,
        name: file.name,
      }));

      return {
        userId: auth.userId,
        organizationId: auth.organizationId,
        [UTFiles]: fileOverrides,
      };
    })
    .onUploadComplete(async ({ file }) => {
      console.log('Budget attachment upload complete:', file.name);

      return {
        url: file.ufsUrl,
        name: file.name,
        size: file.size,
        key: file.key,
        type: file.type,
      };
    }),

  // Upload para anexos de Card
  cardAttachment: f({
    image: { maxFileSize: '32MB', maxFileCount: 5 },
    pdf: { maxFileSize: '32MB', maxFileCount: 5 },
    'application/msword': { maxFileSize: '32MB', maxFileCount: 5 },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
      maxFileSize: '32MB',
      maxFileCount: 5,
    },
    'application/vnd.ms-excel': { maxFileSize: '32MB', maxFileCount: 5 },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
      maxFileSize: '32MB',
      maxFileCount: 5,
    },
    blob: { maxFileSize: '32MB', maxFileCount: 5 },
  })
    .middleware(async ({ files }) => {
      const auth = await getAuth();

      const fileOverrides = files.map((file) => ({
        ...file,
        name: file.name,
      }));

      return {
        userId: auth.userId,
        organizationId: auth.organizationId,
        [UTFiles]: fileOverrides,
      };
    })
    .onUploadComplete(async ({ file }) => {
      console.log('Card attachment upload complete:', file.name);

      return {
        url: file.ufsUrl,
        name: file.name,
        size: file.size,
        key: file.key,
        type: file.type,
      };
    }),

  // Upload para logo de organização
  organizationLogo: f({
    image: { maxFileSize: '4MB', maxFileCount: 1 },
  })
    .middleware(async ({ files }) => {
      const auth = await getAuth();

      const fileOverrides = files.map((file) => ({
        ...file,
        name: file.name,
      }));

      return {
        userId: auth.userId,
        organizationId: auth.organizationId,
        [UTFiles]: fileOverrides,
      };
    })
    .onUploadComplete(async ({ file }) => {
      console.log('Organization logo upload complete:', file.name);

      return {
        url: file.ufsUrl,
        name: file.name,
        size: file.size,
        key: file.key,
        type: file.type,
      };
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
