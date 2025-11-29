import { FileText } from 'lucide-react';

import { ResponsiveDrawer } from '@/components/responsive-drawer';

import { TemplateForm } from '../_components/template-form';

export default function CreateTemplatePage() {
  return (
    <ResponsiveDrawer
      title="Criar Template"
      description="Preencha os dados abaixo para criar um novo template."
      className="max-w-[600px] md:w-[50vw]"
      headerIcon={<FileText className="w-5 h-5" />}
    >
      <TemplateForm />
    </ResponsiveDrawer>
  );
}
