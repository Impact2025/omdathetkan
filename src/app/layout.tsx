import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { AutoLock } from '@/components/AutoLock';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Bonnen',
  description: 'Bonnen en notities beheren',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Bonnen',
  },
};

export const viewport: Viewport = {
  themeColor: '#ec4899',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body className={inter.className}>
        <ServiceWorkerRegistration />
        <AutoLock />
        {children}
      </body>
    </html>
  );
}
