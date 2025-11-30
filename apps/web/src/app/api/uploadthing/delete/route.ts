import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { UTApi } from 'uploadthing/server';

const utapi = new UTApi();

// Função para verificar autenticação
async function getAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return {
      userId: payload.sub,
      organizationId: payload.organizationId,
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuth();

  if (!auth) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { fileKey } = await request.json();

    if (!fileKey) {
      return NextResponse.json({ error: 'fileKey é obrigatório' }, { status: 400 });
    }

    // Deletar arquivo do UploadThing
    await utapi.deleteFiles(fileKey);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file from UploadThing:', error);
    return NextResponse.json({ error: 'Erro ao deletar arquivo' }, { status: 500 });
  }
}
