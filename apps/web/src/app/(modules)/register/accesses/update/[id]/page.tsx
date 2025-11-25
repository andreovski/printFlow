import { cookies } from 'next/headers';

import { ResponsiveDrawer } from '@/components/responsive-drawer';

import { UpdateUserForm } from './_components/update-user-form';

async function getUser(id: string) {
  const token = cookies().get('token')?.value;
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

export default async function UpdateUserPage({ params }: { params: { id: string } }) {
  const user = await getUser(params.id);

  return (
    <ResponsiveDrawer title="Atualizar Acesso" description="Atualize os dados do acesso abaixo.">
      <UpdateUserForm id={params.id} initialData={user} />
    </ResponsiveDrawer>
  );
}
