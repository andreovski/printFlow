import { PencilRuler } from 'lucide-react';
import { cookies } from 'next/headers';

import { ResponsiveDrawer } from '@/components/responsive-drawer';

import { TagForm } from '../../_components/tag-form';

async function getTag(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tags/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch tag');
  }

  const data = await res.json();
  return data.tag;
}

export default async function UpdateTagPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tag = await getTag(id);

  if (!tag) {
    throw new Error('Tag not found');
  }

  return (
    <ResponsiveDrawer
      title="Atualizar Tag"
      description="Atualize os dados da tag abaixo."
      className="max-w-[600px] md:w-[50vw]"
      headerIcon={<PencilRuler className="w-5 h-5" />}
      redirectTo="/settings/tags"
    >
      <TagForm id={id} initialData={tag} />
    </ResponsiveDrawer>
  );
}
