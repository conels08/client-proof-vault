'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const WAITLIST_WINDOW_MS = 10 * 60 * 1000;
const WAITLIST_MAX_REQUESTS = 10;
const waitlistAttempts = new Map<string, number[]>();

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

export async function joinWaitlist(formData: FormData) {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const website = String(formData.get('website') ?? '').trim();
  const startedAt = Number(formData.get('started_at') ?? 0);

  if (website) {
    redirect('/?waitlist=success');
  }

  const now = Date.now();
  if (!Number.isFinite(startedAt) || now - startedAt < 1200) {
    redirect('/?waitlist=error');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect('/?waitlist=invalid');
  }

  const ip = await getClientIp();
  if (isRateLimited(`waitlist:${ip}`)) {
    redirect('/?waitlist=rate_limited');
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
    redirect('/?waitlist=error');
  }

  redirect('/?waitlist=success');
}
