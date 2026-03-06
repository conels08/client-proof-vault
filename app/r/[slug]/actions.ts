'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const REQUEST_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 8;
const submissionAttempts = new Map<string, number[]>();

async function getClientIp() {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  return h.get('x-real-ip')?.trim() || 'unknown';
}

function isRateLimited(key: string) {
  const now = Date.now();
  const windowStart = now - REQUEST_WINDOW_MS;
  const recent = (submissionAttempts.get(key) ?? []).filter((ts) => ts >= windowStart);

  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    submissionAttempts.set(key, recent);
    return true;
  }

  recent.push(now);
  submissionAttempts.set(key, recent);
  return false;
}

export async function submitTestimonialRequest(formData: FormData) {
  const proofPageId = String(formData.get('proof_page_id') ?? '');
  const slug = String(formData.get('slug') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const roleCompany = String(formData.get('role_company') ?? '').trim() || null;
  const quote = String(formData.get('quote') ?? '').trim();
  const website = String(formData.get('website') ?? '').trim();
  const startedAt = Number(formData.get('started_at') ?? 0);

  if (website) {
    redirect(`/r/${slug}?submitted=1`);
  }

  const now = Date.now();
  if (!Number.isFinite(startedAt) || now - startedAt < 1200) {
    redirect(`/r/${slug}?error=${encodeURIComponent('Submission blocked. Please try again.')}`);
  }

  if (!proofPageId || !slug || name.length < 2 || name.length > 80 || quote.length < 8 || quote.length > 2000) {
    redirect(`/r/${slug}?error=${encodeURIComponent('Please complete all required fields and try again.')}`);
  }

  const ip = await getClientIp();
  if (isRateLimited(`${ip}:${proofPageId}`)) {
    redirect(`/r/${slug}?error=${encodeURIComponent('Too many submissions. Please wait and try again.')}`);
  }

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from('testimonial_requests').insert({
    proof_page_id: proofPageId,
    name,
    role_company: roleCompany,
    quote
  });

  if (error) {
    redirect(`/r/${slug}?error=${encodeURIComponent('Could not submit right now. Please try again.')}`);
  }

  redirect(`/r/${slug}?submitted=1`);
}
