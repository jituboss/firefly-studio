import type { Metadata } from 'next';
import Link from 'next/link';
import { SignInForm } from './sign-in-form';
import { AuthShell, FormMessage } from '@/components/auth/form-shell';

export const metadata: Metadata = { title: 'Sign in' };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthShell
      title="Sign in"
      footer={
        <>
          No account?{' '}
          <Link href="/sign-up" className="text-foreground underline underline-offset-4">
            Create one
          </Link>
        </>
      }
    >
      {params.reset ? (
        <div className="mb-4">
          <FormMessage tone="notice">Password updated. Sign in with your new password.</FormMessage>
        </div>
      ) : null}
      <SignInForm />
    </AuthShell>
  );
}
