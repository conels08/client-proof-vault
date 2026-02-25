'use client';

import Link from 'next/link';
import { useState } from 'react';

type PublicUrlControlsProps = {
  slug: string;
  pathPrefix?: '/p' | '/r';
  label?: string;
  helperText?: string;
};

export function PublicUrlControls({ slug, pathPrefix = '/p', label = 'Public URL', helperText }: PublicUrlControlsProps) {
  const [copied, setCopied] = useState(false);
  const relativePath = `${pathPrefix}/${slug}`;

  const copyLink = async () => {
    const fullUrl = `${window.location.origin}${relativePath}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
      <span>
        <span className="inline-flex items-center gap-1">
          {label}
          {helperText ? (
            <span
              className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 bg-white text-[10px] font-semibold text-slate-500"
              title={helperText}
              aria-label={helperText}
            >
              i
            </span>
          ) : null}
          :
        </span>{' '}
        <span className="font-medium text-slate-800">{relativePath}</span>
      </span>
      <button
        type="button"
        onClick={copyLink}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        {copied ? 'Copied' : 'Copy link'}
      </button>
      <Link
        href={relativePath}
        target="_blank"
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        Open
      </Link>
    </div>
  );
}
