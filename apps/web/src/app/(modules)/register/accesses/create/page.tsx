import { ResponsiveDrawer } from '@/components/responsive-drawer';

import { CreateUserForm } from './_components/create-user-form';

export default function CreateUserPage() {
  return (
    <ResponsiveDrawer
      title="Criar Acesso"
      description="Preencha os dados abaixo para criar um novo acesso."
      redirectTo="/register/accesses"
    >
      <CreateUserForm />
    </ResponsiveDrawer>
  );
}
