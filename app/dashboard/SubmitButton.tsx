'use client';

import { useFormStatus } from 'react-dom';

type SubmitButtonProps = {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
};

export function SubmitButton({ children, pendingText = 'Saving...', className = '' }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${className}`}
    >
      {pending ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
      {pending ? pendingText : children}
    </button>
  );
}
