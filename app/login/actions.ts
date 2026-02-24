'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const nextPathRaw = String(formData.get('next') ?? '/dashboard');
  const nextPath = nextPathRaw.startsWith('/') ? nextPathRaw : '/dashboard';

  const supabase = createServerSupabaseClient();
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      redirect(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(nextPath)}`);
    }
  } catch {
    redirect(`/login?error=${encodeURIComponent('Login failed. Please try again.')}&next=${encodeURIComponent(nextPath)}`);
  }

  redirect(nextPath || '/dashboard');
}
