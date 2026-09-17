import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthShell, FormMessage } from '@/components/auth/form-shell';
import { ResendForm } from './resend-form';

export const metadata: Metadata = { title: 'Confirm your email' };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; expired?: string }>;
}) {
  const { token, expired } = await searchParams;

  // Mail sent before the confirmation moved to its own route still points here.
  // Hand those links on rather than letting them fail: the work has to happen
  // somewhere a session cookie can be written.
  if (token) redirect(`/verify-email/confirm?token=${encodeURIComponent(token)}`);

  if (expired) {
    return (
      <AuthShell title="Link expired" description="Confirmation links last 24 hours.">
        <div className="space-y-4">
          <FormMessage tone="error">
            That confirmation link is invalid or has already been used.
          </FormMessage>
          <ResendForm />
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Confirm your email"
      description="Open the link we emailed you. Need another copy?"
    >
      <ResendForm />
    </AuthShell>
  );
}
