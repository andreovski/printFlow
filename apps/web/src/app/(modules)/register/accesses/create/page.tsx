import { CreateUserForm } from './_components/create-user-form';
import { ResponsiveDrawer } from '@/components/responsive-drawer';

export default function CreateUserPage() {
  return (
    <ResponsiveDrawer
      title="Criar Acesso"
      description="Preencha os dados abaixo para criar um novo acesso."
    >
      <div className="p-4 pb-0">
        <CreateUserForm />
      </div>
    </ResponsiveDrawer>
  );
}
