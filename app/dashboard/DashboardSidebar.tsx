import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PublicUrlControls } from './PublicUrlControls';
import { ShareModeControls } from './ShareModeControls';
import type { UserPlan } from '@/lib/billing';

type ProofPage = {
  id: string;
  title: string;
  headline: string;
  bio: string | null;
  slug: string;
  status: 'draft' | 'published';
};

type Testimonial = {
  quote: string;
  name: string;
  role_company: string | null;
};

export default async function DashboardSidebar({
  proofPage,
  plan,
  billingStatus
}: {
  proofPage: ProofPage;
  plan: UserPlan;
  billingStatus?: string;
}) {
  const supabase = await createServerSupabaseClient();

  const { data: sectionsData } = await supabase
    .from('proof_sections')
    .select('id')
    .eq('proof_page_id', proofPage.id);
  const sectionIds = (sectionsData ?? []).map((row: { id: string }) => row.id);

  const [{ data: workRows }, { data: testimonialRows }, { count: viewCount }, { count: ctaClickCount }] = await Promise.all([
    sectionIds.length
      ? supabase
          .from('work_examples')
          .select('metric_text')
          .in('proof_section_id', sectionIds)
      : Promise.resolve({ data: [] }),
    sectionIds.length
      ? supabase
          .from('testimonials')
          .select('quote, name, role_company')
          .in('proof_section_id', sectionIds)
          .limit(1)
      : Promise.resolve({ data: [] }),
    supabase.from('page_views').select('id', { count: 'exact', head: true }).eq('proof_page_id', proofPage.id),
    supabase
      .from('proof_page_events')
      .select('id', { count: 'exact', head: true })
      .eq('proof_page_id', proofPage.id)
      .eq('event_type', 'cta_click')
  ]);

  const workExampleMetrics = (workRows ?? [])
    .map((row: { metric_text: string | null }) => row.metric_text ?? '')
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 2);

  const firstTestimonial = (testimonialRows?.[0] ?? null) as Testimonial | null;
  const summaryTestimonial = firstTestimonial
    ? {
        quote: firstTestimonial.quote,
        name: firstTestimonial.name,
        roleCompany: firstTestimonial.role_company
      }
    : null;

  return (
    <div className="space-y-4">
      <section className="card space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Share Links</h2>
        <PublicUrlControls
          slug={proofPage.slug}
          helperText="Share this public page with prospects, social profiles, proposals, and outbound messages."
        />
        <PublicUrlControls
          slug={proofPage.slug}
          pathPrefix="/r"
          label="Request Link"
          helperText="Use this after completed projects so past clients can submit testimonials directly to your dashboard for review."
        />
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Plan</h2>
        <p className="text-sm text-slate-700">
          Current plan: <span className="font-semibold text-slate-900">{plan === 'pro' ? 'Pro' : 'Free'}</span>
        </p>
        {billingStatus === 'success' ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">Payment successful. Pro access is syncing now.</p>
        ) : null}
        {billingStatus === 'canceled' ? (
          <p className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700">Checkout canceled. You are still on Free.</p>
        ) : null}
        {billingStatus === 'not_configured' ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">Stripe is not configured yet.</p>
        ) : null}
        {billingStatus === 'already_pro' ? (
          <p className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700">You already have Pro access.</p>
        ) : null}
        {plan === 'pro' ? (
          <form action="/api/stripe/portal" method="post">
            <button type="submit" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
              Manage billing
            </button>
          </form>
        ) : (
          <form action="/api/stripe/checkout" method="post">
            <button type="submit" className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700">
              Upgrade to Pro
            </button>
          </form>
        )}
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Quick Share</h2>
        <ShareModeControls
          slug={proofPage.slug}
          title={proofPage.title}
          headline={proofPage.headline}
          bio={proofPage.bio}
          workExampleMetrics={workExampleMetrics}
          testimonial={summaryTestimonial}
        />
      </section>

      <section className="card space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Stats</h2>
        {proofPage.status === 'published' ? (
          <>
            <p className="text-sm text-slate-700">
              Views: <span className="font-semibold text-slate-900">{viewCount ?? 0}</span>
            </p>
            {plan === 'pro' ? (
              <p className="text-sm text-slate-700">
                CTA clicks: <span className="font-semibold text-slate-900">{ctaClickCount ?? 0}</span>
              </p>
            ) : (
              <p className="text-sm text-slate-500">CTA click analytics are Pro only.</p>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-500">Publish to start tracking views and clicks.</p>
        )}
      </section>
    </div>
  );
}
