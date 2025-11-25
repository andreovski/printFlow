import { Poppins } from 'next/font/google';
import { cookies } from 'next/headers';

import { Sidebar } from '@/components/sidebar';
import { cn } from '@/lib/utils';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
});

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get('token')?.value;
  let role = '';
  let userId = '';
  let userName = '';
  let userEmail = '';

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

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background font-poppins antialiased', poppins.variable)}>
        <div className="flex h-screen overflow-hidden">
          <Sidebar role={role} userName={userName} userEmail={userEmail} />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
