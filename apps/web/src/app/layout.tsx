import { ThemeProvider } from 'next-themes';
import { Poppins } from 'next/font/google';

import { PrimaryColorProvider } from '@/components/primary-color-provider';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

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
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background font-poppins antialiased', poppins.variable)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PrimaryColorProvider>
            {children}
            <Toaster position="top-center" />
          </PrimaryColorProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
