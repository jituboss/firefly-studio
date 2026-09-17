import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { readMfaChallenge } from '@/server/auth/mfa';
import { AuthShell } from '@/components/auth/form-shell';
import { VerifyMfaForm } from './verify-form';

export const metadata: Metadata = { title: 'Two-factor code' };

/**
 * E2-06 — the second step of sign-in.
 *
 * Reaching this page without a valid challenge cookie means either an expired
 * attempt or someone visiting the URL directly; both go back to the start
 * rather than being shown a code box that could never succeed.
 */
export default async function VerifyMfaPage() {
  const userId = await readMfaChallenge();
  if (!userId) redirect('/sign-in');

  return (
    <AuthShell
      title="Enter your code"
      description="Open your authenticator app and enter the current six-digit code."
      footer={
        <Link href="/sign-in" className="text-foreground underline underline-offset-4">
          Back to sign in
        </Link>
      }
    >
      <VerifyMfaForm />
    </AuthShell>
  );
}
