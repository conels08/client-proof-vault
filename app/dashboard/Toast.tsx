'use client';

import { useEffect, useState } from 'react';

type ToastProps = {
  message: string;
  type: 'success' | 'error';
};

export function Toast({ message, type }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setVisible(false), 3500);

    const url = new URL(window.location.href);
    if (url.searchParams.has('toast') || url.searchParams.has('toastType')) {
      url.searchParams.delete('toast');
      url.searchParams.delete('toastType');
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }

    return () => clearTimeout(id);
  }, []);

  if (!visible) {
    return null;
  }

  const styles =
    type === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : 'border-red-200 bg-red-50 text-red-800';

  return (
    <div className={`fixed right-4 top-4 z-50 max-w-sm rounded-lg border px-4 py-3 text-sm shadow-lg ${styles}`}>
      <div className="flex items-start justify-between gap-3">
        <p>{message}</p>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="rounded bg-white/70 px-2 py-1 text-xs font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
}
