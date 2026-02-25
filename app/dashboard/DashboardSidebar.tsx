import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PublicUrlControls } from './PublicUrlControls';
import { ShareModeControls } from './ShareModeControls';

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

export default async function DashboardSidebar({ proofPage }: { proofPage: ProofPage }) {
  const supabase = createServerSupabaseClient();

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
            <p className="text-sm text-slate-700">
              CTA clicks: <span className="font-semibold text-slate-900">{ctaClickCount ?? 0}</span>
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-500">Publish to start tracking views and clicks.</p>
        )}
      </section>
    </div>
  );
}
