import { PencilRuler } from 'lucide-react';
import { cookies } from 'next/headers';

import { ResponsiveDrawer } from '@/components/responsive-drawer';

import { TagForm } from '../../_components/tag-form';

async function getTag(id: string) {
  const token = cookies().get('token')?.value;
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

export default async function UpdateTagPage({ params }: { params: { id: string } }) {
  const tag = await getTag(params.id);

  if (!tag) {
    throw new Error('Tag not found');
  }

  return (
    <ResponsiveDrawer
      title="Atualizar Tag"
      description="Atualize os dados da tag abaixo."
      className="max-w-[600px] md:w-[50vw]"
      headerIcon={<PencilRuler className="w-5 h-5" />}
    >
      <TagForm id={params.id} initialData={tag} />
    </ResponsiveDrawer>
  );
}
