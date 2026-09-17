import type { Metadata } from 'next';
import Link from 'next/link';
import { SignUpForm } from './sign-up-form';
import { AuthShell } from '@/components/auth/form-shell';

export const metadata: Metadata = { title: 'Create an account' };

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create your account"
      description="Firefly Studio signs you in, then connects to your own Firefly III instance."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/sign-in" className="text-foreground underline underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthShell>
  );
}
