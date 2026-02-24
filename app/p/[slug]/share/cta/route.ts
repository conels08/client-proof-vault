import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

function normalizeCtaTarget(raw: string) {
  const value = raw.trim();
  if (!value) return '';

  const emailLike = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  if (emailLike) {
    return `mailto:${value}`;
  }

  if (/^(https?:|mailto:|tel:)/i.test(value)) {
    return value;
  }

  return `https://${value}`;
}

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const supabase = createServerSupabaseClient();

  const { data: page } = await supabase
    .from('proof_pages')
    .select('id, slug, cta_enabled, cta_url')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .maybeSingle();

  if (!page || !page.cta_enabled || !page.cta_url) {
    return NextResponse.redirect(new URL(`/p/${params.slug}/share`, request.url));
  }

  await supabase.from('proof_page_events').insert({
    proof_page_id: page.id,
    event_type: 'cta_click'
  });

  const target = normalizeCtaTarget(page.cta_url);
  if (!target) {
    return NextResponse.redirect(new URL(`/p/${params.slug}/share`, request.url));
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: target
    }
  });
}
