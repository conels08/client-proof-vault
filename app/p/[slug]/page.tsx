import { notFound } from 'next/navigation';
import Image from 'next/image';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type ProofPage = {
  id: string;
  title: string;
  headline: string;
  bio: string | null;
  slug: string;
  theme: 'light' | 'dark';
  accent_color: string;
};

type ProofSection = {
  id: string;
  type: 'testimonial' | 'work_example' | 'metric';
  position: number;
};

type Testimonial = {
  id: string;
  proof_section_id: string;
  name: string;
  role_company: string | null;
  quote: string;
  avatar_url: string | null;
  avatar_thumb_url: string | null;
};

type WorkExample = {
  id: string;
  proof_section_id: string;
  image_url: string | null;
  image_thumb_url: string | null;
  link_url: string | null;
  description: string;
  metric_text: string | null;
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

export default async function PublicProofPage({ params }: { params: { slug: string } }) {
  const supabase = createServerSupabaseClient();

  const { data: page } = await supabase
    .from('proof_pages')
    .select('id, title, headline, bio, slug, theme, accent_color')
    .eq('slug', params.slug)
    .maybeSingle();

  if (!page) {
    notFound();
  }

  const { data: sectionRows } = await supabase
    .from('proof_sections')
    .select('id, type, position')
    .eq('proof_page_id', page.id)
    .order('position', { ascending: true });

  const sections = (sectionRows ?? []) as ProofSection[];
  const sectionIds = sections.map((s) => s.id);

  const [{ data: metricsRows }, testimonialsRows, workExamplesRows] = await Promise.all([
    sectionIds.length
      ? supabase.from('metrics').select('id, proof_section_id, label, value').in('proof_section_id', sectionIds)
      : Promise.resolve({ data: [] }),
    (async () => {
      if (!sectionIds.length) return [];
      const withThumbs = await supabase
        .from('testimonials')
        .select('id, proof_section_id, name, role_company, quote, avatar_url, avatar_thumb_url')
        .in('proof_section_id', sectionIds);
      if (!withThumbs.error) return (withThumbs.data ?? []) as Testimonial[];
      const fallback = await supabase
        .from('testimonials')
        .select('id, proof_section_id, name, role_company, quote, avatar_url')
        .in('proof_section_id', sectionIds);
      return ((fallback.data ?? []) as Omit<Testimonial, 'avatar_thumb_url'>[]).map((row) => ({
        ...row,
        avatar_thumb_url: null
      }));
    })(),
    (async () => {
      if (!sectionIds.length) return [];
      const withThumbs = await supabase
        .from('work_examples')
        .select('id, proof_section_id, image_url, image_thumb_url, link_url, description, metric_text')
        .in('proof_section_id', sectionIds);
      if (!withThumbs.error) return (withThumbs.data ?? []) as WorkExample[];
      const fallback = await supabase
        .from('work_examples')
        .select('id, proof_section_id, image_url, link_url, description, metric_text')
        .in('proof_section_id', sectionIds);
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

  const avatarUrls = Object.fromEntries(
    await Promise.all(
      testimonials
        .filter((t) => Boolean(t.avatar_thumb_url || t.avatar_url))
        .map(async (t) => [t.id, await signedUrl(supabase, t.avatar_thumb_url || t.avatar_url, { width: 192, height: 192 })] as const)
    )
  );

  const imageUrls = Object.fromEntries(
    await Promise.all(
      workExamples
        .filter((w) => Boolean(w.image_thumb_url || w.image_url))
        .map(async (w) => [w.id, await signedUrl(supabase, w.image_thumb_url || w.image_url, { width: 640, height: 360 })] as const)
    )
  );

  const publicPage = page as ProofPage;

  return (
    <div
      className={`mx-auto max-w-3xl space-y-6 rounded-2xl border p-5 shadow-sm sm:p-8 ${
        publicPage.theme === 'dark' ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900'
      }`}
      style={{ borderTopColor: publicPage.accent_color, borderTopWidth: 6 }}
    >
      <header className="space-y-2">
        <h1 className="text-2xl font-bold sm:text-3xl">{publicPage.title}</h1>
        <p className={publicPage.theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>{publicPage.headline}</p>
        {publicPage.bio ? (
          <p className={publicPage.theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>{publicPage.bio}</p>
        ) : null}
      </header>

      {sections.map((section) => {
        if (section.type === 'testimonial') {
          const items = testimonials.filter((t) => t.proof_section_id === section.id);
          if (items.length === 0) return null;
          return (
            <section key={section.id} className="space-y-3">
              <h2 className="text-lg font-semibold">Testimonials</h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className={`rounded-lg border p-4 ${
                      publicPage.theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {avatarUrls[item.id] ? (
                        <Image
                          src={avatarUrls[item.id] ?? ''}
                          alt={item.name}
                          width={56}
                          height={56}
                          sizes="56px"
                          className="h-14 w-14 rounded-full border border-slate-200 object-cover"
                        />
                      ) : null}
                      <div className="space-y-1">
                        <p className="text-sm italic">"{item.quote}"</p>
                        <p className="text-sm font-medium">
                          {item.name}
                          {item.role_company ? `, ${item.role_company}` : ''}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        }

        if (section.type === 'work_example') {
          const items = workExamples.filter((w) => w.proof_section_id === section.id);
          if (items.length === 0) return null;
          return (
            <section key={section.id} className="space-y-3">
              <h2 className="text-lg font-semibold">Work Examples</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className={`rounded-lg border p-4 ${
                      publicPage.theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    {imageUrls[item.id] ? (
                      <div className="mb-3 overflow-hidden rounded-lg border border-slate-200">
                        <div className="aspect-video">
                          <Image
                            src={imageUrls[item.id] ?? ''}
                            alt="Work preview"
                            width={640}
                            height={360}
                            sizes="(max-width: 640px) 100vw, 50vw"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>
                    ) : null}
                    <p className="text-sm">{item.description}</p>
                    {item.metric_text ? <p className="mt-2 text-sm font-medium">{item.metric_text}</p> : null}
                    {item.link_url ? (
                      <a href={item.link_url} className="mt-2 inline-block text-sm text-brand-700 hover:underline">
                        View project
                      </a>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          );
        }

        const items = metrics.filter((m) => m.proof_section_id === section.id);
        if (items.length === 0) return null;
        return (
          <section key={section.id} className="space-y-3">
            <h2 className="text-lg font-semibold">Metrics</h2>
            <div className="grid grid-cols-2 gap-3">
              {items.map((item) => (
                <article
                  key={item.id}
                  className={`rounded-lg border p-4 ${
                    publicPage.theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
                  <p className="text-xl font-semibold">{item.value}</p>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
