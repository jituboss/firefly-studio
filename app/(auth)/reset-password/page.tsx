import type { Metadata } from 'next';
import Link from 'next/link';
import { ResetPasswordForm } from './reset-password-form';
import { AuthShell, FormMessage } from '@/components/auth/form-shell';

export const metadata: Metadata = { title: 'Choose a new password' };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <AuthShell title="Invalid link">
        <div className="space-y-4">
          <FormMessage tone="error">This reset link is missing its token.</FormMessage>
          <Link
            href="/forgot-password"
            className="text-foreground block text-sm underline underline-offset-4"
          >
            Request a new one
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a new password"
      description="Signing in again will be required on all your other devices."
    >
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}
