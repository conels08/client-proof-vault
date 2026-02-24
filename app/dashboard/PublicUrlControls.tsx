'use client';

import Link from 'next/link';
import { useState } from 'react';

type PublicUrlControlsProps = {
  slug: string;
  pathPrefix?: '/p' | '/r';
  label?: string;
};

export function PublicUrlControls({ slug, pathPrefix = '/p', label = 'Public URL' }: PublicUrlControlsProps) {
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
        {label}:{' '}
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
