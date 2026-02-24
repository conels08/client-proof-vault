import { createServerSupabaseClient } from '@/lib/supabase/server';

type ProofPage = {
  id: string;
  title: string;
  headline: string;
  bio: string | null;
  status: 'draft' | 'published';
};

type StrengthItem = {
  label: string;
  points: number;
  complete: boolean;
  suggestion: string;
};

export default async function DashboardStrength({ proofPage }: { proofPage: ProofPage }) {
  const supabase = createServerSupabaseClient();

  const { data: sectionRows } = await supabase
    .from('proof_sections')
    .select('id, type')
    .eq('proof_page_id', proofPage.id);

  const sections = (sectionRows ?? []) as { id: string; type: 'testimonial' | 'work_example' | 'metric' }[];
  const testimonialSectionIds = sections.filter((s) => s.type === 'testimonial').map((s) => s.id);
  const workSectionIds = sections.filter((s) => s.type === 'work_example').map((s) => s.id);

  const [{ count: testimonialCount }, { data: workRows }] = await Promise.all([
    testimonialSectionIds.length
      ? supabase.from('testimonials').select('id', { count: 'exact', head: true }).in('proof_section_id', testimonialSectionIds)
      : Promise.resolve({ count: 0 }),
    workSectionIds.length
      ? supabase.from('work_examples').select('id, metric_text').in('proof_section_id', workSectionIds)
      : Promise.resolve({ data: [] })
  ]);

  const workExamples = (workRows ?? []) as { metric_text: string | null }[];
  const workExamplesWithMetric = workExamples.filter((item) => Boolean(item.metric_text?.trim())).length;
  const workMetricPoints = Math.min(workExamplesWithMetric, 2);

  const strengthItems: StrengthItem[] = [
    {
      label: 'Title is present',
      points: 1,
      complete: Boolean(proofPage.title.trim()),
      suggestion: 'Add a clear page title.'
    },
    {
      label: 'Headline is present',
      points: 1,
      complete: Boolean(proofPage.headline.trim()),
      suggestion: 'Add a concise, outcome-focused headline.'
    },
    {
      label: 'Bio is present',
      points: 1,
      complete: Boolean(proofPage.bio?.trim()),
      suggestion: 'Add a short bio with your niche and value.'
    },
    {
      label: 'At least 2 work examples',
      points: 2,
      complete: workExamples.length >= 2,
      suggestion: 'Add one more work example to improve credibility.'
    },
    {
      label: 'Work examples include metric text (up to 2)',
      points: 2,
      complete: workMetricPoints >= 2,
      suggestion: 'Add metric text to your work examples (for example, +32% conversion).'
    },
    {
      label: 'At least 2 testimonials',
      points: 2,
      complete: (testimonialCount ?? 0) >= 2,
      suggestion: 'Add one more testimonial to strengthen trust.'
    },
    {
      label: 'Page is published',
      points: 1,
      complete: proofPage.status === 'published',
      suggestion: 'Publish your page when content is ready.'
    }
  ];

  const strengthScore = strengthItems.reduce((sum, item) => {
    if (!item.complete) return sum;
    if (item.label === 'Work examples include metric text (up to 2)') return sum + workMetricPoints;
    return sum + item.points;
  }, 0);
  const strengthPercent = Math.round((strengthScore / 10) * 100);
  const nextBestStep =
    [...strengthItems]
      .filter((item) => !item.complete)
      .sort((a, b) => a.points - b.points)[0]?.suggestion ?? 'Your page is fully optimized. Keep sharing it.';

  return (
    <section className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Page Strength</h2>
        <span className="text-sm font-medium text-slate-700">{strengthScore}/10</span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div className="h-full bg-brand-600 transition-all" style={{ width: `${strengthPercent}%` }} />
      </div>
      <p className="text-xs text-slate-500">{strengthPercent}% complete</p>

      <div className="grid gap-2 md:grid-cols-2">
        {strengthItems.map((item) => {
          const pointsEarned = item.label === 'Work examples include metric text (up to 2)' ? workMetricPoints : item.points;
          return (
            <div key={item.label} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <span className={item.complete ? 'text-slate-800' : 'text-slate-500'}>
                {item.complete ? '✓' : '○'} {item.label}
              </span>
              <span className="text-xs text-slate-500">
                +{item.complete ? pointsEarned : 0}/{item.points}
              </span>
            </div>
          );
        })}
      </div>

      <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
        <span className="font-medium">Next best step:</span> {nextBestStep}
      </p>
    </section>
  );
}
