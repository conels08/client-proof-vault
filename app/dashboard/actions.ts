'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

function cleanFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9_.-]/g, '-').toLowerCase();
}

function isValidHexColor(value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

function redirectDashboard(message: string, type: 'success' | 'error'): never {
  redirect(`/dashboard?toast=${encodeURIComponent(message)}&toastType=${type}`);
}

async function requireUser() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return { supabase, user };
}

export async function updateProofPage(formData: FormData) {
  const { supabase } = await requireUser();

  const id = String(formData.get('id') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const headline = String(formData.get('headline') ?? '').trim();
  const bio = String(formData.get('bio') ?? '').trim() || null;
  const slug = String(formData.get('slug') ?? '').trim();
  const status = String(formData.get('status') ?? 'draft');
  const theme = String(formData.get('theme') ?? 'light');
  const accentColor = String(formData.get('accent_color') ?? '#3B82F6').trim();

  if (!isValidHexColor(accentColor)) {
    redirectDashboard('Accent color must be a valid hex value like #3B82F6.', 'error');
  }

  const { error } = await supabase
    .from('proof_pages')
    .update({
      title,
      headline,
      bio,
      slug,
      status,
      theme,
      accent_color: accentColor,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    redirectDashboard(error.message, 'error');
  }

  revalidatePath('/dashboard');
  redirectDashboard(status === 'published' ? 'Proof page saved and published.' : 'Proof page saved as draft.', 'success');
}

export async function createSection(formData: FormData) {
  const { supabase } = await requireUser();
  const proofPageId = String(formData.get('proof_page_id') ?? '');
  const type = String(formData.get('type') ?? 'testimonial');

  const { data: lastSection } = await supabase
    .from('proof_sections')
    .select('position')
    .eq('proof_page_id', proofPageId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPosition = (lastSection?.position ?? 0) + 1;

  const { error } = await supabase
    .from('proof_sections')
    .insert({ proof_page_id: proofPageId, type, position: nextPosition });

  if (error) {
    redirectDashboard(error.message, 'error');
  }

  revalidatePath('/dashboard');
  redirectDashboard('Section added.', 'success');
}

export async function moveSection(formData: FormData) {
  const { supabase } = await requireUser();
  const sectionId = String(formData.get('section_id') ?? '');
  const direction = String(formData.get('direction') ?? 'up');

  const { data: current, error: currentError } = await supabase
    .from('proof_sections')
    .select('id, proof_page_id, position')
    .eq('id', sectionId)
    .single();

  if (currentError || !current) {
    redirectDashboard('Section not found.', 'error');
  }

  const sortAscending = direction === 'down';
  const comparator = direction === 'down' ? 'gt' : 'lt';

  let query = supabase
    .from('proof_sections')
    .select('id, position')
    .eq('proof_page_id', current.proof_page_id)
    .order('position', { ascending: sortAscending })
    .limit(1);

  query = comparator === 'gt' ? query.gt('position', current.position) : query.lt('position', current.position);

  const { data: neighbor } = await query.maybeSingle();

  if (!neighbor) {
    redirectDashboard('Section is already at the edge.', 'error');
  }

  const { error: firstSwapError } = await supabase.from('proof_sections').update({ position: -1 }).eq('id', current.id);
  if (firstSwapError) {
    redirectDashboard(firstSwapError.message, 'error');
  }

  const { error: secondSwapError } = await supabase
    .from('proof_sections')
    .update({ position: current.position })
    .eq('id', neighbor.id);
  if (secondSwapError) {
    redirectDashboard(secondSwapError.message, 'error');
  }

  const { error: thirdSwapError } = await supabase
    .from('proof_sections')
    .update({ position: neighbor.position })
    .eq('id', current.id);
  if (thirdSwapError) {
    redirectDashboard(thirdSwapError.message, 'error');
  }

  revalidatePath('/dashboard');
  redirectDashboard(direction === 'down' ? 'Section moved down.' : 'Section moved up.', 'success');
}

export async function deleteSection(formData: FormData) {
  const { supabase } = await requireUser();
  const sectionId = String(formData.get('section_id') ?? '');

  const { error } = await supabase.from('proof_sections').delete().eq('id', sectionId);
  if (error) {
    redirectDashboard(error.message, 'error');
  }

  revalidatePath('/dashboard');
  redirectDashboard('Section deleted.', 'success');
}

export async function createTestimonial(formData: FormData) {
  const { supabase } = await requireUser();
  const proofSectionId = String(formData.get('proof_section_id') ?? '');
  const name = String(formData.get('new_name') ?? '').trim();
  const roleCompany = String(formData.get('new_role_company') ?? '').trim() || null;
  const quote = String(formData.get('new_quote') ?? '').trim();

  const { error } = await supabase.from('testimonials').insert({
    proof_section_id: proofSectionId,
    name,
    role_company: roleCompany,
    quote
  });

  if (error) {
    redirectDashboard(error.message, 'error');
  }

  revalidatePath('/dashboard');
  redirectDashboard('Testimonial added.', 'success');
}

export async function updateTestimonial(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get('id') ?? '');

  const { error } = await supabase
    .from('testimonials')
    .update({
      name: String(formData.get('name') ?? '').trim(),
      role_company: String(formData.get('role_company') ?? '').trim() || null,
      quote: String(formData.get('quote') ?? '').trim()
    })
    .eq('id', id);

  if (error) {
    redirectDashboard(error.message, 'error');
  }

  revalidatePath('/dashboard');
  redirectDashboard('Testimonial saved.', 'success');
}

export async function deleteTestimonial(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get('id') ?? '');

  const { error } = await supabase.from('testimonials').delete().eq('id', id);
  if (error) {
    redirectDashboard(error.message, 'error');
  }

  revalidatePath('/dashboard');
  redirectDashboard('Testimonial deleted.', 'success');
}

export async function uploadTestimonialAvatar(formData: FormData) {
  const { supabase, user } = await requireUser();
  const testimonialId = String(formData.get('testimonial_id') ?? '');
  const proofPageId = String(formData.get('proof_page_id') ?? '');
  const file = formData.get('avatar') as File | null;

  if (!file || file.size === 0) {
    redirectDashboard('Please select an avatar image.', 'error');
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${randomUUID()}-${cleanFileName(file.name.replace(`.${ext}`, ''))}.${ext}`;
  const objectPath = `${user.id}/${proofPageId}/${fileName}`;

  const { error: uploadError } = await supabase.storage.from('proof-media').upload(objectPath, file, { upsert: false });
  if (uploadError) {
    redirectDashboard(uploadError.message, 'error');
  }

  const { error: updateError } = await supabase.from('testimonials').update({ avatar_url: objectPath }).eq('id', testimonialId);
  if (updateError) {
    redirectDashboard(updateError.message, 'error');
  }

  revalidatePath('/dashboard');
  redirectDashboard('Avatar uploaded.', 'success');
}

export async function createWorkExample(formData: FormData) {
  const { supabase } = await requireUser();
  const proofSectionId = String(formData.get('proof_section_id') ?? '');

  const { error } = await supabase.from('work_examples').insert({
    proof_section_id: proofSectionId,
    link_url: String(formData.get('new_link_url') ?? '').trim() || null,
    description: String(formData.get('new_description') ?? '').trim(),
    metric_text: String(formData.get('new_metric_text') ?? '').trim() || null
  });

  if (error) {
    redirectDashboard(error.message, 'error');
  }

  revalidatePath('/dashboard');
  redirectDashboard('Work example added.', 'success');
}

export async function updateWorkExample(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get('id') ?? '');

  const { error } = await supabase
    .from('work_examples')
    .update({
      link_url: String(formData.get('link_url') ?? '').trim() || null,
      description: String(formData.get('description') ?? '').trim(),
      metric_text: String(formData.get('metric_text') ?? '').trim() || null
    })
    .eq('id', id);

  if (error) {
    redirectDashboard(error.message, 'error');
  }

  revalidatePath('/dashboard');
  redirectDashboard('Work example saved.', 'success');
}

export async function deleteWorkExample(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get('id') ?? '');

  const { error } = await supabase.from('work_examples').delete().eq('id', id);
  if (error) {
    redirectDashboard(error.message, 'error');
  }

  revalidatePath('/dashboard');
  redirectDashboard('Work example deleted.', 'success');
}

export async function uploadWorkExampleImage(formData: FormData) {
  const { supabase, user } = await requireUser();
  const workExampleId = String(formData.get('work_example_id') ?? '');
  const proofPageId = String(formData.get('proof_page_id') ?? '');
  const file = formData.get('image') as File | null;

  if (!file || file.size === 0) {
    redirectDashboard('Please select an image file.', 'error');
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${randomUUID()}-${cleanFileName(file.name.replace(`.${ext}`, ''))}.${ext}`;
  const objectPath = `${user.id}/${proofPageId}/${fileName}`;

  const { error: uploadError } = await supabase.storage.from('proof-media').upload(objectPath, file, { upsert: false });
  if (uploadError) {
    redirectDashboard(uploadError.message, 'error');
  }

  const { error: updateError } = await supabase.from('work_examples').update({ image_url: objectPath }).eq('id', workExampleId);
  if (updateError) {
    redirectDashboard(updateError.message, 'error');
  }

  revalidatePath('/dashboard');
  redirectDashboard('Work image uploaded.', 'success');
}

export async function createMetric(formData: FormData) {
  const { supabase } = await requireUser();
  const proofSectionId = String(formData.get('proof_section_id') ?? '');

  const { error } = await supabase.from('metrics').insert({
    proof_section_id: proofSectionId,
    label: String(formData.get('label') ?? '').trim(),
    value: String(formData.get('value') ?? '').trim()
  });

  if (error) {
    redirectDashboard(error.message, 'error');
  }

  revalidatePath('/dashboard');
  redirectDashboard('Metric added.', 'success');
}

export async function updateMetric(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get('id') ?? '');

  const { error } = await supabase
    .from('metrics')
    .update({
      label: String(formData.get('label') ?? '').trim(),
      value: String(formData.get('value') ?? '').trim()
    })
    .eq('id', id);

  if (error) {
    redirectDashboard(error.message, 'error');
  }

  revalidatePath('/dashboard');
  redirectDashboard('Metric saved.', 'success');
}

export async function deleteMetric(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get('id') ?? '');

  const { error } = await supabase.from('metrics').delete().eq('id', id);
  if (error) {
    redirectDashboard(error.message, 'error');
  }

  revalidatePath('/dashboard');
  redirectDashboard('Metric deleted.', 'success');
}

export async function approveTestimonialRequest(formData: FormData) {
  const { supabase } = await requireUser();
  const requestId = String(formData.get('request_id') ?? '');

  const { data: request, error: requestError } = await supabase
    .from('testimonial_requests')
    .select('id, proof_page_id, name, role_company, quote, avatar_url, status')
    .eq('id', requestId)
    .single();

  if (requestError || !request) {
    redirectDashboard('Testimonial request not found.', 'error');
  }

  if (request.status !== 'pending') {
    redirectDashboard('Only pending requests can be approved.', 'error');
  }

  const { data: existingSection } = await supabase
    .from('proof_sections')
    .select('id, position')
    .eq('proof_page_id', request.proof_page_id)
    .eq('type', 'testimonial')
    .order('position', { ascending: true })
    .limit(1)
    .maybeSingle();

  let testimonialSectionId = existingSection?.id ?? null;

  if (!testimonialSectionId) {
    const { data: lastSection } = await supabase
      .from('proof_sections')
      .select('position')
      .eq('proof_page_id', request.proof_page_id)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextPosition = (lastSection?.position ?? 0) + 1;

    const { data: newSection, error: sectionError } = await supabase
      .from('proof_sections')
      .insert({
        proof_page_id: request.proof_page_id,
        type: 'testimonial',
        position: nextPosition
      })
      .select('id')
      .single();

    if (sectionError || !newSection) {
      redirectDashboard(sectionError?.message || 'Failed to create testimonial section.', 'error');
    }

    testimonialSectionId = newSection.id;
  }

  const { error: insertError } = await supabase.from('testimonials').insert({
    proof_section_id: testimonialSectionId,
    name: request.name,
    role_company: request.role_company,
    quote: request.quote,
    avatar_url: request.avatar_url
  });

  if (insertError) {
    redirectDashboard(insertError.message, 'error');
  }

  const { error: updateError } = await supabase
    .from('testimonial_requests')
    .update({ status: 'approved' })
    .eq('id', request.id);

  if (updateError) {
    redirectDashboard(updateError.message, 'error');
  }

  revalidatePath('/dashboard');
  revalidatePath('/p/[slug]', 'page');
  redirectDashboard('Testimonial request approved and added to your page.', 'success');
}

export async function rejectTestimonialRequest(formData: FormData) {
  const { supabase } = await requireUser();
  const requestId = String(formData.get('request_id') ?? '');

  const { error } = await supabase
    .from('testimonial_requests')
    .update({ status: 'rejected' })
    .eq('id', requestId);

  if (error) {
    redirectDashboard(error.message, 'error');
  }

  revalidatePath('/dashboard');
  redirectDashboard('Testimonial request rejected.', 'success');
}
