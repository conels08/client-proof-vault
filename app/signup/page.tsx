import Link from 'next/link';
import { signup } from './actions';

export default function SignupPage({ searchParams }: { searchParams?: { error?: string } }) {
  const error = searchParams?.error;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Create account</h1>
        <p className="text-sm text-slate-600">Set up your single public proof page.</p>
      </div>

      {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      <form action={signup} className="card space-y-3">
        <label className="block space-y-1 text-sm">
          <span>Email</span>
          <input type="email" name="email" required />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Password</span>
          <input type="password" name="password" minLength={6} required />
        </label>
        <button type="submit" className="w-full">
          Sign up
        </button>
      </form>

      <p className="text-sm text-slate-600">
        Already have an account?{' '}
        <Link href="/login" className="text-brand-700 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
