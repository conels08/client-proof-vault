import type { SupabaseClient } from '@supabase/supabase-js';

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

export async function generateUniqueSlug(supabase: SupabaseClient, seed: string) {
  const base = slugify(seed) || 'my-proof';

  for (let i = 0; i < 20; i += 1) {
    const candidate = i === 0 ? base : `${base}-${Math.floor(Math.random() * 10000)}`;
    const { data } = await supabase
      .from('proof_pages')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle();

    if (!data) {
      return candidate;
    }
  }

  return `${base}-${Date.now()}`;
}
