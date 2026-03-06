'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function signup(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    redirect('/signup?error=Please%20enter%20email%20and%20password.');
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent('Sign-up failed. Please verify your details and try again.')}`);
  }

  if (!data.session) {
    redirect(`/signup?success=${encodeURIComponent('Check your email to confirm your account, then log in.')}`);
  }

  redirect('/dashboard');
}
