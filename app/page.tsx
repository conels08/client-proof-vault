import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import Reveal from './components/Reveal';

export default async function HomePage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-16 pb-10">
      <Reveal as="section" className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-slate-50" />
        <div className="relative space-y-6">
          <p className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
            Client Proof Vault
          </p>
          <div className="max-w-3xl space-y-4">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">Show proof. Build trust. Win clients.</h1>
            <p className="max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Turn your best work into one focused proof page that helps prospects say yes — faster.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            <Link href="/signup" className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700">
              Get started
            </Link>
            <Link
              href="/p/demo/share"
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              View demo
            </Link>
          </div>
          <p className="mt-3 text-center text-sm text-muted-foreground sm:text-left">Free to start. No credit card required.</p>
        </div>
      </Reveal>

      <Reveal as="section" className="py-20" delayMs={50}>
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="space-y-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Your proof is scattered. Your prospects are busy.
            </h2>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-600">
              You&apos;ve done great work — but when it&apos;s time to close the deal, your proof lives everywhere:
            </p>
          </div>

          <ul className="mx-auto max-w-xl space-y-4 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            {[
              'Old emails',
              'Google Docs',
              'Random screenshots',
              'DMs with testimonials',
              'A portfolio that doesn’t tell the full story'
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <p className="mx-auto mt-12 mb-6 max-w-2xl text-center text-base font-medium leading-snug text-slate-700">
            Prospects won&apos;t dig for proof.
            <br />
            If it&apos;s not obvious in seconds, they move on.
          </p>

          <div className="rounded-2xl border border-slate-200 bg-slate-100/70 p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase text-slate-600">Client Proof Vault gives you one focused page that:</p>
            <ul className="mt-4 space-y-2">
              {[
                'Shows outcomes, not just projects',
                'Highlights real client testimonials',
                'Displays metrics that build confidence',
                'Works perfectly in DMs, proposals, and follow-ups'
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-lg font-semibold text-foreground">No digging. No explaining. No scattered links.</p>
          </div>

          <p className="text-center text-lg font-semibold text-slate-900">Everything your prospect needs — in one link.</p>
        </div>
      </Reveal>

      <Reveal as="section" className="space-y-5" delayMs={60}>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-slate-900">How it works</h2>
          <p className="max-w-2xl text-sm text-slate-600">A fast workflow designed for freelancers and small teams.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['1', 'Build your proof page', 'Add your headline, work examples, testimonials, and metrics in one dashboard.'],
            ['2', 'Collect testimonials', 'Share a request link after delivery and review submissions before publishing.'],
            ['3', 'Share and track', 'Send your public/share link and track views plus CTA clicks from one place.']
          ].map(([step, title, body]) => (
            <article
              key={step}
              className="card space-y-3 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                {step}
              </span>
              <h3 className="text-base font-semibold text-slate-900">{title}</h3>
              <p className="text-sm leading-relaxed text-slate-600">{body}</p>
            </article>
          ))}
        </div>
      </Reveal>

      <Reveal as="section" className="space-y-5" delayMs={90} staggerChildren>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-slate-900">Everything you need to prove value</h2>
          <p className="max-w-2xl text-sm text-slate-600">Built to make your proof easy to send and hard to ignore.</p>
        </div>
        <div className="grid gap-x-4 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          {[
            ['Share Mode', 'A condensed, mobile-first page for fast prospect scanning and sharing.'],
            ['Testimonial Requests', 'Collect client quotes through a public request link and moderate in dashboard.'],
            ['CTA + Click Tracking', 'Attach a clear action on share pages and monitor click activity.'],
            ['Page Strength Checklist', 'Rules-based readiness score with practical next-step guidance.'],
            ['Fast Thumbnails', 'Upload once, render optimized preview images for better performance.'],
            ['RLS-Safe Access', 'Public and owner access patterns are enforced by Supabase policies.']
          ].map(([title, body]) => (
            <article key={title} className="card space-y-2">
              <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </Reveal>

      <Reveal as="section" className="space-y-5" delayMs={110}>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-slate-900">Product preview</h2>
          <p className="max-w-2xl text-sm text-slate-600">Representative frames of dashboard and public proof experiences.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {['Dashboard editor', 'Public proof share page'].map((label) => (
            <article key={label} className="card p-3">
              <div className="aspect-[16/10] overflow-hidden rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="space-y-3 p-4">
                  <div className="h-3 w-24 rounded bg-slate-300" />
                  <div className="h-7 w-3/4 rounded bg-slate-200" />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="h-24 rounded bg-white/80 shadow-sm" />
                    <div className="h-24 rounded bg-white/80 shadow-sm" />
                    <div className="h-24 rounded bg-white/80 shadow-sm" />
                    <div className="h-24 rounded bg-white/80 shadow-sm" />
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm font-medium text-slate-700">{label}</p>
            </article>
          ))}
        </div>
      </Reveal>

      <Reveal as="section" className="space-y-5" delayMs={120}>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-slate-900">Mini FAQ</h2>
        </div>
        <div className="grid gap-3">
          {[
            ['What is it?', 'Client Proof Vault is a focused proof page builder for freelancers and service businesses.'],
            ['Is it a website builder?', 'No. It is purpose-built for one high-trust proof page instead of full website creation.'],
            ['Can clients submit testimonials?', 'Yes. You can share a request link and approve or reject submissions in dashboard.'],
            ['Is my page public?', 'Only published proof pages are public; draft content remains private.'],
            ['What is Pro?', 'Pro will add advanced analytics and branding controls. It is planned and not required for MVP use.']
          ].map(([q, a]) => (
            <details key={q} className="rounded-xl border border-slate-200 bg-white p-4">
              <summary className="cursor-pointer text-sm font-semibold text-slate-900">{q}</summary>
              <p className="mt-2 text-sm text-slate-600">{a}</p>
            </details>
          ))}
        </div>
      </Reveal>

      <Reveal as="section" className="space-y-5" delayMs={130}>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-slate-900">Pricing</h2>
          <p className="max-w-2xl text-sm text-slate-600">Start free. Upgrade when you need more distribution and visibility features.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <article className="card space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">Free</h3>
            <p className="text-sm text-slate-600">Create one proof page, collect testimonials, and share your link.</p>
            <p className="text-sm font-medium text-slate-700">$0 / month</p>
            <p className="mt-2 text-sm text-muted-foreground">No credit card required</p>
          </article>
          <article className="card space-y-3 border-brand-200 bg-brand-50/40">
            <h3 className="text-lg font-semibold text-slate-900">Pro</h3>
            <p className="text-sm text-slate-600">Advanced analytics and additional polish tools for conversion-focused teams.</p>
            <p className="text-sm font-medium text-slate-700">Pro coming soon</p>
            <Link href="/signup" className="inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              Join waitlist
            </Link>
          </article>
        </div>
      </Reveal>

      <Reveal as="section" className="rounded-2xl border border-slate-200 bg-slate-900 px-6 py-10 text-center text-white shadow-sm sm:px-10" delayMs={150}>
        <h2 className="text-2xl font-semibold sm:text-3xl">Show real proof before the sales call starts.</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
          Stop sending scattered links. Send one page that closes.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/signup" className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
            Get started
          </Link>
          <Link href="/p/demo/share" className="rounded-lg border border-slate-600 bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-100 hover:bg-slate-700">
            View demo
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
