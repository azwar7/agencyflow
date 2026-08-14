import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import { NavigationProgress } from '@/components/NavigationProgress';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import './globals.css';

export const metadata: Metadata = {
  title: 'AgencyFlow | High-Velocity SaaS CRM & Operations Platform',
  description: 'The operating system for modern agencies. Streamline your workflow, manage clients, and scale with confidence.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Hanken+Grotesk:wght@600;700;800&family=Geist:wght@500;600&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-background">
        <ErrorBoundary>
          <AuthProvider>
            <NavigationProgress />
            {children}
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
