'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function submitTestimonialRequest(formData: FormData) {
  const proofPageId = String(formData.get('proof_page_id') ?? '');
  const slug = String(formData.get('slug') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const roleCompany = String(formData.get('role_company') ?? '').trim() || null;
  const quote = String(formData.get('quote') ?? '').trim();

  const supabase = createServerSupabaseClient();

  const { error } = await supabase.from('testimonial_requests').insert({
    proof_page_id: proofPageId,
    name,
    role_company: roleCompany,
    quote
  });

  if (error) {
    redirect(`/r/${slug}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/r/${slug}?submitted=1`);
}
