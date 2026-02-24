'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { buildShareSummary } from '@/lib/shareSummary';
import { Toast } from './Toast';

type ShareModeControlsProps = {
  slug: string;
  title: string;
  headline: string | null;
  bio: string | null;
  workExampleMetrics: string[];
  testimonial: {
    quote: string;
    name: string;
    roleCompany?: string | null;
  } | null;
};

type LocalToast = {
  id: number;
  message: string;
  type: 'success' | 'error';
};

export function ShareModeControls({
  slug,
  title,
  headline,
  bio,
  workExampleMetrics,
  testimonial
}: ShareModeControlsProps) {
  const [toast, setToast] = useState<LocalToast | null>(null);
  const sharePath = `/p/${slug}/share`;

  const shareUrl = useMemo(() => {
    const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (configured) {
      return `${configured.replace(/\/+$/, '')}${sharePath}`;
    }

    if (typeof window !== 'undefined') {
      return `${window.location.origin}${sharePath}`;
    }

    return sharePath;
  }, [sharePath]);

  const copyShareSummary = async () => {
    const summary = buildShareSummary({
      title,
      headline,
      bio,
      workExampleMetrics,
      testimonial,
      shareUrl
    });

    try {
      await navigator.clipboard.writeText(summary);
      setToast({ id: Date.now(), message: 'Share summary copied.', type: 'success' });
    } catch {
      setToast({ id: Date.now(), message: 'Could not copy share summary.', type: 'error' });
    }
  };

  return (
    <>
      {toast ? <Toast key={toast.id} message={toast.message} type={toast.type} /> : null}
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <button
          type="button"
          onClick={copyShareSummary}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Copy share summary
        </button>
        <Link
          href={sharePath}
          target="_blank"
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Open share page
        </Link>
      </div>
    </>
  );
}
