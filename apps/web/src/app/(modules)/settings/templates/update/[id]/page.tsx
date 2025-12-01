import { PencilRuler } from 'lucide-react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { ResponsiveDrawer } from '@/components/responsive-drawer';

import { TemplateForm } from '../../_components/template-form';

async function getTemplate(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/templates/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  return data.template;
}

export default async function UpdateTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const template = await getTemplate(id);

  if (!template) {
    redirect('/settings/templates');
  }

  return (
    <ResponsiveDrawer
      title="Atualizar Template"
      description="Atualize os dados do template abaixo."
      className="max-w-[600px] md:w-[50vw]"
      headerIcon={<PencilRuler className="w-5 h-5" />}
    >
      <TemplateForm id={id} initialData={template} />
    </ResponsiveDrawer>
  );
}
