// frontend/app/layout.tsx
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/components/providers/AuthProvider';

export const metadata: Metadata = {
  title: { default: 'DevMind — AI Developer Platform', template: '%s | DevMind' },
  description: 'AI-powered code review, documentation generation, and bug tracking for modern developer teams.',
  keywords: ['code review', 'AI', 'developer tools', 'documentation', 'bug tracker'],
  authors: [{ name: 'DevMind' }],
  openGraph: {
    type: 'website',
    title: 'DevMind — AI Developer Platform',
    description: 'Supercharge your dev workflow with AI-powered tools.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans`}>
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: 'text-sm font-medium',
              style: {
                background: 'hsl(var(--card))',
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--border))',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
