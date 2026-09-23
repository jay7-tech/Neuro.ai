import type { Metadata } from 'next';
// Self-hosted font: no build-time network fetch, no third-party request at runtime.
import '@fontsource-variable/inter';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from '@/components/app/providers';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: { default: 'Neuro-AI', template: '%s · Neuro-AI' },
  description: 'Care coordination for people living with dementia, their caregivers and clinicians.',
};

// Applied before paint so dark-mode users never see a white flash.
const themeScript = `(function(){try{var t=localStorage.getItem('neuro-ai-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={cn('min-h-screen bg-background font-sans antialiased')}>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
