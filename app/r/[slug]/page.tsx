import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { submitTestimonialRequest } from './actions';

type ProofPage = {
  id: string;
  title: string;
  headline: string;
  slug: string;
};

export const dynamic = 'force-dynamic';

export default async function TestimonialRequestPage({
  params,
  searchParams
}: {
  params: { slug: string };
  searchParams?: { submitted?: string; error?: string };
}) {
  const supabase = createServerSupabaseClient();

  const { data: page } = await supabase
    .from('proof_pages')
    .select('id, title, headline, slug')
    .eq('slug', params.slug)
    .maybeSingle();

  if (!page) {
    notFound();
  }

  const proofPage = page as ProofPage;

  if (searchParams?.submitted === '1') {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Thank you</h1>
        <p className="mt-2 text-slate-600">Your testimonial has been submitted for review.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Share your experience</h1>
        <p className="mt-1 text-sm text-slate-600">
          Submit a testimonial for <span className="font-medium text-slate-800">{proofPage.title}</span>.
        </p>
      </div>

      {searchParams?.error ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{searchParams.error}</p>
      ) : null}

      <form action={submitTestimonialRequest} className="space-y-3">
        <input type="hidden" name="proof_page_id" value={proofPage.id} />
        <input type="hidden" name="slug" value={proofPage.slug} />

        <label className="block space-y-1 text-sm">
          <span>Name</span>
          <input name="name" required placeholder="Your name" />
        </label>

        <label className="block space-y-1 text-sm">
          <span>Role / Company (optional)</span>
          <input name="role_company" placeholder="e.g., Founder, Acme Co" />
        </label>

        <label className="block space-y-1 text-sm">
          <span>Testimonial</span>
          <textarea name="quote" rows={5} required placeholder="Describe your experience and results." />
        </label>

        <p className="text-xs text-slate-500">Avatar uploads are not enabled on this public form in MVP.</p>

        <button type="submit">Submit testimonial</button>
      </form>
    </div>
  );
}
