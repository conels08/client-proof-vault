# Client Proof Vault

Next.js 14 App Router app for creating and sharing one public proof page per user, backed by an existing Supabase database (tables + RLS already configured).

## Stack

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Supabase Auth + Data API + Storage
- `@supabase/supabase-js` + `@supabase/ssr`

## Requirements

- Node.js 18+
- Existing Supabase project with schema and RLS already applied
- Storage bucket: `proof-media`

## Environment

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_or_publishable_key
# Optional: used for absolute share-summary links; falls back to window.location.origin
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Billing (Stripe)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
# Required for webhook sync writes
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

No service role key is required for MVP.
`SUPABASE_SERVICE_ROLE_KEY` is required only if you enable Stripe webhook syncing.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Implemented Routes

- `/` landing page
- `/login` login
- `/signup` signup
- `/dashboard` authenticated dashboard (auto-creates one proof page if missing)
- `/p/[slug]` public proof page

## Core Behaviors

- One proof page per user (relies on DB constraint + RLS)
- Dashboard CRUD for:
  - Proof page fields: title, headline, bio, slug, status, theme, accent_color
  - Sections: create, reorder (up/down), delete
  - Testimonials: create/update/delete + avatar upload
  - Work examples: create/update/delete + image upload
  - Metrics: create/update/delete
- Public route fetches only published pages/content via RLS
- Public page logs `page_views` insert on load
- Storage upload key format is enforced in app logic:
  - `{user_id}/{proof_page_id}/{filename}`

## Notes

- This app intentionally does not generate or run SQL/migrations.
- Signed URLs are used for media rendering from the `proof-media` bucket.
