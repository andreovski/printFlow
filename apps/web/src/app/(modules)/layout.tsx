import { cookies } from 'next/headers';

import { Sidebar } from '@/components/sidebar';

import { AppContextProvider } from '../hooks/useAppContext';
import { getOrganization } from '../http/requests/organization';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get('token')?.value;
  let role = '';
  let userId = '';
  let userName = '';
  let userEmail = '';
  let organization = null;

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      role = payload.role;
      userId = payload.sub;
    } catch (_e) {
      // Ignore invalid token
    }
  }

  // Fetch user data
  if (userId && token) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        userName = data.user.name || '';
        userEmail = data.user.email || '';
      }
    } catch (_e) {
      // Ignore fetch errors
    }
  }

  // Fetch organization data
  try {
    const data = await getOrganization();
    organization = data.organization;
  } catch (_e) {
    // Ignore organization fetch errors
  }

  const user = userId
    ? {
        id: userId,
        name: userName || null,
        email: userEmail,
        role,
      }
    : null;

  return (
    <AppContextProvider organization={organization} user={user}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </AppContextProvider>
  );
}
