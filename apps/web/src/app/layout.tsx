import { Poppins } from 'next/font/google';

import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

import { AppContextProvider } from './hooks/useAppContext';
import { getOrganization } from './http/requests/organization';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
});

export const metadata = {
  title: 'Magic System',
  description: 'Print Shop SaaS',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let organization = null;

  try {
    const data = await getOrganization();
    organization = data.organization;
  } catch (error) {
    console.error('Failed to fetch organization:', error);
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background font-poppins antialiased', poppins.variable)}>
        <AppContextProvider organization={organization}>{children}</AppContextProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
