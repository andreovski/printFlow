import { SpeedInsights } from '@vercel/speed-insights/next';
import { ThemeProvider } from 'next-themes';
import { Poppins, Josefin_Sans } from 'next/font/google';

import { FontProvider } from '@/components/font-provider';
import { LoadingBarProvider } from '@/components/loading-bar-provider';
import { PrimaryColorProvider } from '@/components/primary-color-provider';
import { QueryProvider } from '@/components/query-provider';
import { ThemeColorProvider } from '@/components/theme-color-provider';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

import './globals.css';
import '@/lib/theme/colors/ambar.css';
import '@/lib/theme/colors/sky.css';
import '@/lib/theme/colors/violet.css';
import '@/lib/theme/colors/cappuccino.css';
import '@/lib/theme/colors/ice.css';
import '@/lib/theme/colors/lilac.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
});

const josefinSans = Josefin_Sans({
  subsets: ['latin'],
  variable: '--font-josefin-sans',
});

export const metadata = {
  title: 'PrintFlow',
  description: 'PrintFlow',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-poppins antialiased',
          poppins.variable,
          josefinSans.variable
        )}
      >
        <LoadingBarProvider />
        <SpeedInsights />
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ThemeColorProvider>
              <PrimaryColorProvider>
                <FontProvider>
                  {children}
                  <Toaster position="top-center" />
                </FontProvider>
              </PrimaryColorProvider>
            </ThemeColorProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
