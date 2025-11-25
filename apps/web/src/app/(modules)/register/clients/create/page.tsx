import { UserRoundPlus } from 'lucide-react';

import { ResponsiveDrawer } from '@/components/responsive-drawer';

import { ClientForm } from '../_components/client-form';

export default function CreateClientPage() {
  return (
    <ResponsiveDrawer
      title="Criar Cliente"
      description="Preencha os dados abaixo para criar um novo cliente."
      className="max-w-[900px] md:w-[60vw]"
      headerIcon={<UserRoundPlus />}
    >
      <ClientForm />
    </ResponsiveDrawer>
  );
}
