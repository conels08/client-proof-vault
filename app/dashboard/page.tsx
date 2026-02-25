import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateUniqueSlug } from '@/lib/slug';
import { PublicUrlControls } from './PublicUrlControls';
import { Toast } from './Toast';
import DashboardStrength from './DashboardStrength';
import DashboardDeferred from './DashboardDeferred';
import DashboardSidebar from './DashboardSidebar';

type ProofPage = {
  id: string;
  title: string;
  headline: string;
  bio: string | null;
  slug: string;
  status: 'draft' | 'published';
  theme: 'light' | 'dark';
  accent_color: string;
  cta_enabled: boolean;
  cta_label: string | null;
  cta_url: string | null;
  avatar_url: string | null;
  avatar_updated_at?: string | null;
};

function getParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

async function ensureProofPage(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  userId: string,
  email: string | null
): Promise<ProofPage> {
  const { data: existing } = await supabase
    .from('proof_pages')
    .select('id, title, headline, bio, slug, status, theme, accent_color, cta_enabled, cta_label, cta_url, avatar_url, avatar_updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    return existing as ProofPage;
  }

  const title = email ?? 'My Proof';
  const slug = await generateUniqueSlug(supabase, email?.split('@')[0] || 'my-proof');

  const { data: created, error } = await supabase
    .from('proof_pages')
    .insert({
      user_id: userId,
      title,
      headline: 'Freelancer',
      slug,
      status: 'draft',
      theme: 'light',
      cta_enabled: false
    })
    .select('id, title, headline, bio, slug, status, theme, accent_color, cta_enabled, cta_label, cta_url, avatar_url, avatar_updated_at')
    .single();

  if (error || !created) {
    throw new Error(error?.message || 'Could not create proof page');
  }

  return created as ProofPage;
}

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: { toast?: string | string[]; toastType?: string | string[] };
}) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const proofPage = await ensureProofPage(supabase, user.id, user.email ?? null);
  const toastMessage = getParam(searchParams?.toast);
  const toastType = getParam(searchParams?.toastType) === 'error' ? 'error' : 'success';

  return (
    <div className="space-y-6 pb-10">
      {toastMessage ? <Toast message={toastMessage} type={toastType} /> : null}

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-slate-600">Manage your proof page content and publish when ready.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <div className="space-y-4 lg:col-span-4 lg:sticky lg:top-6">
          <Suspense
            fallback={
              <section className="card space-y-3" aria-busy="true">
                <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
                <div className="h-10 animate-pulse rounded bg-slate-100" />
                <div className="h-10 animate-pulse rounded bg-slate-100" />
              </section>
            }
          >
            <DashboardSidebar proofPage={proofPage} />
          </Suspense>
          <Suspense
            fallback={
              <section className="card space-y-4" aria-busy="true">
                <div className="h-6 w-44 animate-pulse rounded bg-slate-200" />
                <div className="h-2 w-full animate-pulse rounded bg-slate-200" />
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="h-10 animate-pulse rounded bg-slate-100" />
                  <div className="h-10 animate-pulse rounded bg-slate-100" />
                </div>
              </section>
            }
          >
            <DashboardStrength proofPage={proofPage} />
          </Suspense>
        </div>

        <div className="space-y-6 lg:col-span-8">
        <Suspense
          fallback={
            <section className="card space-y-3" aria-busy="true">
              <div className="h-6 w-52 animate-pulse rounded bg-slate-200" />
              <div className="h-10 animate-pulse rounded bg-slate-100" />
              <div className="h-10 animate-pulse rounded bg-slate-100" />
            </section>
          }
        >
          <DashboardDeferred proofPage={proofPage} />
        </Suspense>
        </div>
      </div>
    </div>
  );
}
