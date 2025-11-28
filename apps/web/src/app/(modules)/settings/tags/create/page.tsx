import { TagIcon } from 'lucide-react';

import { ResponsiveDrawer } from '@/components/responsive-drawer';

import { TagForm } from '../_components/tag-form';

export default function CreateTagPage() {
  return (
    <ResponsiveDrawer
      title="Criar Tag"
      description="Preencha os dados abaixo para criar uma nova tag."
      className="max-w-[600px] md:w-[50vw]"
      headerIcon={<TagIcon className="w-5 h-5" />}
    >
      <TagForm />
    </ResponsiveDrawer>
  );
}
