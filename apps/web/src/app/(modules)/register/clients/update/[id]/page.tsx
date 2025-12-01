import { Phone, PhoneCall, User } from 'lucide-react';
import { cookies } from 'next/headers';

import { ResponsiveDrawer } from '@/components/responsive-drawer';
import { DialogDescription } from '@/components/ui/dialog';
import { formatDocument, formatPhone } from '@/lib/masks';

import { ClientForm } from '../../_components/client-form';
// import { Whatsapp } from '@/assets/svg/whatsapp';

async function getClient(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch client');
  }

  const data = await res.json();
  return data.client;
}

export default async function UpdateClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClient(id);

  const document = client.document;
  const formattedDocument = document ? formatDocument(document) : '';

  const Description = (
    <DialogDescription className="flex items-center gap-2">
      {client.name || client.fantasyName} ◦ {formattedDocument} ◦{' '}
      {client.isWhatsapp ? <PhoneCall /> : <Phone />} {formatPhone(client.phone)}
    </DialogDescription>
  );

  return (
    <ResponsiveDrawer
      title="Atualizar Cliente"
      description={Description}
      className="max-w-[900px] md:w-[60vw]"
      headerIcon={<User />}
    >
      <ClientForm id={id} initialData={client} />
    </ResponsiveDrawer>
  );
}
