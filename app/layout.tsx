import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { logout } from '@/app/logout/actions';

export const metadata: Metadata = {
  title: 'Client Proof Vault',
  description: 'Create and share one trust-building proof page.'
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-sm font-semibold text-slate-900">
              Client Proof Vault
            </Link>
            <nav className="flex items-center gap-2">
              <Link href="/" className="text-sm text-slate-700 hover:text-slate-900">
                Home
              </Link>
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-sm text-slate-700 hover:text-slate-900"
                  >
                    Dashboard
                  </Link>
                  <form action={logout}>
                    <button type="submit">Logout</button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm text-slate-700 hover:text-slate-900">
                    Login
                  </Link>
                  <Link href="/signup" className="text-sm text-slate-700 hover:text-slate-900">
                    Sign up
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 py-8">{children}</main>
        <footer className="border-t border-slate-200 bg-white/90">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 text-xs text-slate-500">
            <p>Client Proof Vault</p>
            <p>{new Date().getFullYear()} All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
