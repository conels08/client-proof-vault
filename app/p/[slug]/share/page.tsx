import { notFound } from 'next/navigation';
import Image from 'next/image';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type ProofPage = {
  id: string;
  title: string;
  headline: string;
  slug: string;
  theme: 'light' | 'dark';
  accent_color: string;
  cta_enabled: boolean;
  cta_label: string | null;
  cta_url: string | null;
};

type Testimonial = {
  id: string;
  proof_section_id: string;
  name: string;
  role_company: string | null;
  quote: string;
  avatar_url: string | null;
  avatar_thumb_url: string | null;
  created_at: string;
};

type WorkExample = {
  id: string;
  proof_section_id: string;
  image_url: string | null;
  image_thumb_url: string | null;
  link_url: string | null;
  description: string;
  created_at: string;
};

type Metric = {
  id: string;
  proof_section_id: string;
  label: string;
  value: string;
};

async function signedUrl(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  path: string | null,
  transform?: { width: number; height?: number }
) {
  if (!path) return null;
  const { data } = await supabase.storage.from('proof-media').createSignedUrl(path, 3600, transform ? { transform } : undefined);
  return data?.signedUrl ?? null;
}

export const dynamic = 'force-dynamic';

export default async function PublicProofSharePage({ params }: { params: { slug: string } }) {
  const supabase = createServerSupabaseClient();

  const { data: page } = await supabase
    .from('proof_pages')
    .select('id, title, headline, slug, theme, accent_color, cta_enabled, cta_label, cta_url')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .maybeSingle();

  if (!page) {
    notFound();
  }

  const [{ data: testimonialSectionRows }, { data: workSectionRows }, { data: metricSectionRows }] = await Promise.all([
    supabase
      .from('proof_sections')
      .select('id')
      .eq('proof_page_id', page.id)
      .eq('type', 'testimonial')
      .order('position', { ascending: true }),
    supabase
      .from('proof_sections')
      .select('id')
      .eq('proof_page_id', page.id)
      .eq('type', 'work_example')
      .order('position', { ascending: true }),
    supabase
      .from('proof_sections')
      .select('id')
      .eq('proof_page_id', page.id)
      .eq('type', 'metric')
      .order('position', { ascending: true })
  ]);

  const testimonialSectionIds = (testimonialSectionRows ?? []).map((s: { id: string }) => s.id);
  const workSectionIds = (workSectionRows ?? []).map((s: { id: string }) => s.id);
  const metricSectionIds = (metricSectionRows ?? []).map((s: { id: string }) => s.id);

  const [{ data: metricsRows }, testimonialsRows, workExamplesRows] = await Promise.all([
    metricSectionIds.length
      ? supabase.from('metrics').select('id, proof_section_id, label, value').in('proof_section_id', metricSectionIds).limit(4)
      : Promise.resolve({ data: [] }),
    (async () => {
      if (!testimonialSectionIds.length) return [];
      const withThumbs = await supabase
        .from('testimonials')
        .select('id, proof_section_id, name, role_company, quote, avatar_url, avatar_thumb_url, created_at')
        .in('proof_section_id', testimonialSectionIds)
        .order('created_at', { ascending: false })
        .limit(1);
      if (!withThumbs.error) return (withThumbs.data ?? []) as Testimonial[];
      const fallback = await supabase
        .from('testimonials')
        .select('id, proof_section_id, name, role_company, quote, avatar_url, created_at')
        .in('proof_section_id', testimonialSectionIds)
        .order('created_at', { ascending: false })
        .limit(1);
      return ((fallback.data ?? []) as Omit<Testimonial, 'avatar_thumb_url'>[]).map((row) => ({
        ...row,
        avatar_thumb_url: null
      }));
    })(),
    (async () => {
      if (!workSectionIds.length) return [];
      const withThumbs = await supabase
        .from('work_examples')
        .select('id, proof_section_id, image_url, image_thumb_url, link_url, description, created_at')
        .in('proof_section_id', workSectionIds)
        .order('created_at', { ascending: false })
        .limit(3);
      if (!withThumbs.error) return (withThumbs.data ?? []) as WorkExample[];
      const fallback = await supabase
        .from('work_examples')
        .select('id, proof_section_id, image_url, link_url, description, created_at')
        .in('proof_section_id', workSectionIds)
        .order('created_at', { ascending: false })
        .limit(3);
      return ((fallback.data ?? []) as Omit<WorkExample, 'image_thumb_url'>[]).map((row) => ({
        ...row,
        image_thumb_url: null
      }));
    })()
  ]);

  const testimonials = testimonialsRows as Testimonial[];
  const workExamples = workExamplesRows as WorkExample[];
  const metrics = (metricsRows ?? []) as Metric[];

  await supabase.from('page_views').insert({ proof_page_id: page.id });

  const firstTestimonial = testimonials[0] ?? null;
  const highlightAvatarUrl = firstTestimonial
    ? await signedUrl(supabase, firstTestimonial.avatar_thumb_url || firstTestimonial.avatar_url, { width: 192, height: 192 })
    : null;

  const workImageUrls = Object.fromEntries(
    await Promise.all(
      workExamples
        .slice(0, 3)
        .filter((w) => Boolean(w.image_thumb_url || w.image_url))
        .map(async (w) => [w.id, await signedUrl(supabase, w.image_thumb_url || w.image_url, { width: 640, height: 360 })] as const)
    )
  );

  const compactMetrics = metrics.slice(0, 4);
  const compactWorkExamples = workExamples.slice(0, 3);
  const publicPage = page as ProofPage;

  return (
    <div
      className={`mx-auto max-w-4xl space-y-6 rounded-2xl border p-5 shadow-sm sm:p-8 ${
        publicPage.theme === 'dark' ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900'
      }`}
      style={{ borderTopColor: publicPage.accent_color, borderTopWidth: 6 }}
    >
      <header className="space-y-2">
        <h1 className="text-2xl font-bold sm:text-3xl">{publicPage.title}</h1>
        <p className={publicPage.theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>{publicPage.headline}</p>
        {publicPage.cta_enabled && publicPage.cta_url ? (
          <div className="pt-2">
            <a
              href={`/p/${publicPage.slug}/share/cta`}
              className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              {publicPage.cta_label?.trim() || 'Contact'}
            </a>
          </div>
        ) : null}
      </header>

      {compactMetrics.length > 0 ? (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {compactMetrics.map((item) => (
            <article
              key={item.id}
              className={`rounded-lg border p-3 ${
                publicPage.theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
              <p className="text-lg font-semibold">{item.value}</p>
            </article>
          ))}
        </section>
      ) : null}

      {firstTestimonial ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Testimonial Highlight</h2>
          <article
            className={`rounded-xl border p-4 ${
              publicPage.theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <div className="flex items-start gap-3">
              {highlightAvatarUrl ? (
                <Image
                  src={highlightAvatarUrl}
                  alt={firstTestimonial.name}
                  width={56}
                  height={56}
                  sizes="56px"
                  className="h-14 w-14 rounded-full border border-slate-200 object-cover"
                />
              ) : null}
              <div className="space-y-1">
                <p className="text-sm italic">"{firstTestimonial.quote}"</p>
                <p className="text-sm font-medium">
                  {firstTestimonial.name}
                  {firstTestimonial.role_company ? `, ${firstTestimonial.role_company}` : ''}
                </p>
              </div>
            </div>
          </article>
        </section>
      ) : null}

      {compactWorkExamples.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Work Examples</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {compactWorkExamples.map((item) => (
              <article
                key={item.id}
                className={`rounded-lg border p-3 ${
                  publicPage.theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'
                }`}
              >
                {workImageUrls[item.id] ? (
                  <div className="mb-2 overflow-hidden rounded-md border border-slate-200">
                    <div className="aspect-video">
                      <Image
                        src={workImageUrls[item.id] ?? ''}
                        alt="Work example"
                        width={640}
                        height={360}
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                ) : null}
                <p className="text-sm">{item.description}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
