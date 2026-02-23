import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-lg space-y-3 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-slate-600">The proof page does not exist or is not published.</p>
      <Link href="/" className="inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm text-white">
        Back home
      </Link>
    </div>
  );
}
