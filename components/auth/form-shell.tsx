import Link from 'next/link';
import { Flame } from 'lucide-react';

/** Shared chrome for every unauthenticated page. */
export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main
      id="main"
      className="bg-background flex min-h-svh flex-col items-center justify-center px-4 py-10"
    >
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <Flame className="text-primary size-5" aria-hidden="true" />
          <span className="font-semibold tracking-tight">Firefly Studio</span>
        </Link>

        <div className="bg-card rounded-xl border p-6 shadow-sm">
          <div className="mb-5 space-y-1">
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
            {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
          </div>
          {children}
        </div>

        {footer ? (
          <div className="text-muted-foreground mt-5 text-center text-sm">{footer}</div>
        ) : null}
      </div>
    </main>
  );
}

export function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-expense text-xs">
      {children}
    </p>
  );
}

export function FormMessage({ tone, children }: { tone: 'error' | 'notice'; children: string }) {
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={
        tone === 'error'
          ? 'bg-expense-muted text-expense rounded-md px-3 py-2 text-sm'
          : 'bg-income-muted text-income rounded-md px-3 py-2 text-sm'
      }
    >
      {children}
    </p>
  );
}

export function SubmitButton({
  pending,
  children,
}: {
  pending: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-ring h-9 w-full rounded-md text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
    >
      {pending ? 'Working…' : children}
    </button>
  );
}
