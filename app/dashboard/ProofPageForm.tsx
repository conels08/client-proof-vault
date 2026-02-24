'use client';

import { useMemo, useState } from 'react';
import { updateProofPage } from './actions';
import { SubmitButton } from './SubmitButton';

type ProofPageFormProps = {
  proofPage: {
    id: string;
    title: string;
    headline: string;
    bio: string | null;
    slug: string;
    status: 'draft' | 'published';
    theme: 'light' | 'dark';
    accent_color: string;
    cta_enabled: boolean;
    cta_label: string | null;
    cta_url: string | null;
  };
};

function isValidHexColor(value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

export function ProofPageForm({ proofPage }: ProofPageFormProps) {
  const initialColor = isValidHexColor(proofPage.accent_color) ? proofPage.accent_color : '#3B82F6';
  const [accentColor, setAccentColor] = useState(initialColor);
  const [advancedHex, setAdvancedHex] = useState(initialColor);
  const [status, setStatus] = useState<'draft' | 'published'>(proofPage.status);
  const [ctaEnabled, setCtaEnabled] = useState<boolean>(proofPage.cta_enabled);
  const [ctaLabel, setCtaLabel] = useState<string>(proofPage.cta_label ?? '');
  const [ctaUrl, setCtaUrl] = useState<string>(proofPage.cta_url ?? '');

  const colorError = useMemo(() => {
    if (!advancedHex) return 'Enter a hex color such as #3B82F6.';
    if (!isValidHexColor(advancedHex)) return 'Use format #RRGGBB (example: #3B82F6).';
    return '';
  }, [advancedHex]);

  return (
    <form action={updateProofPage} className="grid gap-4 md:grid-cols-2">
      <input type="hidden" name="id" value={proofPage.id} />
      <input type="hidden" name="accent_color" value={advancedHex} />

      <label className="space-y-1 text-sm md:col-span-1">
        <span>Title</span>
        <input name="title" defaultValue={proofPage.title} required placeholder="e.g., Alex Rivera - UX Proof" />
        <p className="text-xs text-slate-500">Shown as the main heading on your public page.</p>
      </label>

      <label className="space-y-1 text-sm md:col-span-1">
        <span>Headline</span>
        <input name="headline" defaultValue={proofPage.headline} required placeholder="e.g., Product Designer for SaaS teams" />
        <p className="text-xs text-slate-500">A short trust-building one-liner.</p>
      </label>

      <label className="space-y-1 text-sm md:col-span-2">
        <span>Bio</span>
        <textarea
          name="bio"
          rows={3}
          defaultValue={proofPage.bio ?? ''}
          placeholder="Add brief context about who you help and the results you deliver."
        />
        <p className="text-xs text-slate-500">Optional. Keep it concise and specific.</p>
      </label>

      <label className="space-y-1 text-sm md:col-span-1">
        <span>Slug</span>
        <input name="slug" defaultValue={proofPage.slug} required placeholder="e.g., alex-product-proof" />
        <p className="text-xs text-slate-500">Used in your shareable URL: /p/your-slug</p>
      </label>

      <label className="space-y-1 text-sm md:col-span-1">
        <span>Status</span>
        <select name="status" defaultValue={proofPage.status} onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}>
          <option value="draft">draft</option>
          <option value="published">published</option>
        </select>
        <p className="text-xs text-slate-500">
          {status === 'draft'
            ? 'Draft is private. Publish when you are ready for public access and view tracking.'
            : 'Published makes your page available publicly at /p/slug.'}
        </p>
      </label>

      <label className="space-y-1 text-sm md:col-span-1">
        <span>Theme</span>
        <select name="theme" defaultValue={proofPage.theme}>
          <option value="light">light</option>
          <option value="dark">dark</option>
        </select>
        <p className="text-xs text-slate-500">Controls public page visual mode.</p>
      </label>

      <div className="space-y-2 text-sm md:col-span-1">
        <span className="block">Accent color</span>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={accentColor}
            onChange={(e) => {
              setAccentColor(e.target.value);
              setAdvancedHex(e.target.value);
            }}
            className="h-10 w-16 cursor-pointer rounded border border-slate-300 p-1"
            aria-label="Accent color picker"
          />
          <input
            value={advancedHex}
            onChange={(e) => {
              const value = e.target.value.trim();
              setAdvancedHex(value);
              if (isValidHexColor(value)) {
                setAccentColor(value);
              }
            }}
            placeholder="#3B82F6"
            aria-invalid={Boolean(colorError)}
          />
        </div>
        <p className={`text-xs ${colorError ? 'text-red-600' : 'text-slate-500'}`}>
          {colorError || 'Pick a color or enter a custom #RRGGBB value.'}
        </p>
      </div>

      <div className="space-y-2 text-sm md:col-span-2 rounded-lg border border-slate-200 p-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="cta_enabled"
            defaultChecked={proofPage.cta_enabled}
            onChange={(e) => setCtaEnabled(e.target.checked)}
            className="h-4 w-4"
          />
          <span className="font-medium">Enable share page CTA</span>
        </label>
        <p className="text-xs text-slate-500">Show a primary conversion button on `/p/{proofPage.slug}/share`.</p>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span>CTA label</span>
            <input
              name="cta_label"
              defaultValue={proofPage.cta_label ?? ''}
              placeholder="e.g., Book a call"
              onChange={(e) => setCtaLabel(e.target.value)}
            />
            <p className="text-xs text-slate-500">Optional. Defaults to “Contact” when empty.</p>
          </label>
          <label className="space-y-1 text-sm">
            <span>CTA URL or email</span>
            <input
              name="cta_url"
              defaultValue={proofPage.cta_url ?? ''}
              placeholder="https://cal.com/you or hello@you.com"
              onChange={(e) => setCtaUrl(e.target.value)}
            />
            <p className="text-xs text-slate-500">Use a full URL or email address.</p>
          </label>
        </div>

        {ctaEnabled && ctaUrl.trim() ? (
          <div className="pt-1">
            <span className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white">
              {ctaLabel.trim() || 'Contact'}
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3 md:col-span-2">
        <SubmitButton pendingText="Saving page..." className="bg-brand-600 text-white hover:bg-brand-700">
          Save page
        </SubmitButton>
      </div>
    </form>
  );
}
