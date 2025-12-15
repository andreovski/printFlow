import { cookies } from 'next/headers';

import { ResponsiveDrawer } from '@/components/responsive-drawer';

import { UpdateUserForm } from './_components/update-user-form';

async function getUser(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch user');
  }

  const data = await res.json();
  return data.user;
}

export default async function UpdateUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser(id);

  return (
    <ResponsiveDrawer
      title="Atualizar Acesso"
      description="Atualize os dados do acesso abaixo."
      redirectTo="/register/accesses"
    >
      <UpdateUserForm id={id} initialData={user} />
    </ResponsiveDrawer>
  );
}
