import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const WAITLIST_WINDOW_MS = 10 * 60 * 1000;
const WAITLIST_MAX_REQUESTS = 10;
const waitlistAttempts = new Map<string, number[]>();

function isRateLimited(key: string) {
  const now = Date.now();
  const windowStart = now - WAITLIST_WINDOW_MS;
  const recent = (waitlistAttempts.get(key) ?? []).filter((ts) => ts >= windowStart);

  if (recent.length >= WAITLIST_MAX_REQUESTS) {
    waitlistAttempts.set(key, recent);
    return true;
  }

  recent.push(now);
  waitlistAttempts.set(key, recent);
  return false;
}

function redirectWithStatus(request: Request, status: string) {
  return NextResponse.redirect(new URL(`/?waitlist=${status}`, request.url));
}

export async function POST(request: Request) {
  const formData = await request.formData();

  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const website = String(formData.get('website') ?? '').trim();
  const startedAt = Number(formData.get('started_at') ?? 0);

  if (website) {
    return redirectWithStatus(request, 'success');
  }

  const now = Date.now();
  if (!Number.isFinite(startedAt) || now - startedAt < 1200) {
    return redirectWithStatus(request, 'error');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return redirectWithStatus(request, 'invalid');
  }

  const forwarded = request.headers.get('x-forwarded-for');
  const ip = (forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') ?? 'unknown')?.trim() || 'unknown';

  if (isRateLimited(`waitlist:${ip}`)) {
    return redirectWithStatus(request, 'rate_limited');
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('waitlist_signups')
    .upsert(
      {
        email,
        source: 'landing_page'
      },
      {
        onConflict: 'email',
        ignoreDuplicates: false
      }
    );

  if (error) {
    return redirectWithStatus(request, 'error');
  }

  return redirectWithStatus(request, 'success');
}
