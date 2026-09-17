import type { Metadata } from 'next';
import Link from 'next/link';
import { verifyEmailAction } from '@/server/auth/actions';
import { AuthShell, FormMessage } from '@/components/auth/form-shell';
import { ResendForm } from './resend-form';

export const metadata: Metadata = { title: 'Confirm your email' };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <AuthShell
        title="Confirm your email"
        description="Open the link we emailed you. Need another copy?"
      >
        <ResendForm />
      </AuthShell>
    );
  }

  const result = await verifyEmailAction(token);

  if (!result.ok) {
    return (
      <AuthShell title="Link expired" description="Confirmation links last 24 hours.">
        <div className="space-y-4">
          <FormMessage tone="error">{result.message}</FormMessage>
          <ResendForm />
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Email confirmed"
      description="You are signed in. Next, connect your Firefly III instance."
    >
      <Link
        href="/onboarding"
        className="bg-primary text-primary-foreground hover:bg-primary/90 flex h-9 w-full items-center justify-center rounded-md text-sm font-medium transition-colors"
      >
        Connect Firefly III
      </Link>
    </AuthShell>
  );
}
