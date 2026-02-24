-- Add thumbnail path columns for optimized card/list rendering.
alter table public.testimonials
  add column if not exists avatar_thumb_url text;

alter table public.work_examples
  add column if not exists image_thumb_url text;
