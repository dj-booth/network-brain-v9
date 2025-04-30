import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Sidebar } from './components/Sidebar';
import { Toaster } from 'sonner';
import { createClient } from '@/lib/supabase/server';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Network Brain',
  description: 'Your personal network management tool',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <html lang="en">
      <body className={`${inter.className} bg-background text-foreground`}>
        <div className="flex min-h-screen">
          {/* DEBUG: Show session info */}
          <div style={{ position: 'absolute', top: 0, left: 0, background: '#fffbe6', color: '#333', zIndex: 9999, padding: 8, fontSize: 12 }}>
            <strong>Session present:</strong> {session ? 'Yes' : 'No'}<br />
            <strong>Session object:</strong> <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(session, null, 2)}</pre>
          </div>
          {session && <Sidebar />}
          <main className={`flex-1 p-8 ${!session ? 'w-full' : ''}`}>
            {children}
          </main>
        </div>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
