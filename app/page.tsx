import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-slate-900">Client Proof Vault</h1>
      <p className="max-w-2xl text-slate-600">
        Build one focused proof page with testimonials, work examples, and metrics you can share in minutes.
      </p>
      <div className="flex gap-3">
        <Link href="/signup" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white">
          Get started
        </Link>
        <Link href="/login" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700">
          Log in
        </Link>
      </div>
    </div>
  );
}
