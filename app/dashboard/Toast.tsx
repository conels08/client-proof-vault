'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type ToastProps = {
  message: string;
  type: 'success' | 'error';
};

export function Toast({ message, type }: ToastProps) {
  const [visible, setVisible] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const cleanedRef = useRef(false);

  useEffect(() => {
    if (cleanedRef.current) {
      return;
    }

    if (searchParams.has('toast') || searchParams.has('toastType')) {
      cleanedRef.current = true;
      router.replace(pathname, { scroll: false });
    }
  }, [pathname, router, searchParams]);

  useEffect(() => {
    const id = setTimeout(() => setVisible(false), 3500);
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
