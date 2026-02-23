import Link from 'next/link';
import { login } from './actions';

export default function LoginPage({
  searchParams
}: {
  searchParams?: { error?: string; next?: string };
}) {
  const error = searchParams?.error;
  const nextPath = searchParams?.next ?? '/dashboard';

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Log in</h1>
        <p className="text-sm text-slate-600">Access your proof page dashboard.</p>
      </div>

      {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      <form action={login} className="card space-y-3">
        <input type="hidden" name="next" value={nextPath} />
        <label className="block space-y-1 text-sm">
          <span>Email</span>
          <input type="email" name="email" required />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Password</span>
          <input type="password" name="password" required />
        </label>
        <button type="submit" className="w-full">
          Log in
        </button>
      </form>

      <p className="text-sm text-slate-600">
        No account?{' '}
        <Link href="/signup" className="text-brand-700 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
