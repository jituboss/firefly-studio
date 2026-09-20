import type { Metadata } from 'next';
import Link from 'next/link';
import { SignInForm } from './sign-in-form';
import { FormMessage } from '@/components/auth/form-shell';
import {
  LandingFormCard,
  LandingHero,
  LandingMark,
  LandingShell,
} from '@/components/landing/landing';

export const metadata: Metadata = {
  title: 'Sign in',
  description:
    'A modern front end for Firefly III: double-entry accounting, real reporting and rule-driven automation, connected to the instance you already run.',
};

/**
 * Sign in, and the landing page.
 *
 * They are the same route because for a self-hosted app they are the same
 * moment: whoever opens this either has an account or is deciding whether to
 * make one, and sending the second group to a separate marketing page would
 * mean maintaining two front doors that must never disagree.
 *
 * The ORDER is the design. On a phone the form comes first and the pitch is
 * below it, because a returning user opens this every morning and should not
 * scroll past an advertisement to type a password. From `lg` the two sit side
 * by side and neither has to scroll. `order-*` handles that without rendering
 * anything twice — the DOM order is the mobile order, which is also the
 * reading order for a screen reader and for anyone tabbing through.
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const params = await searchParams;

  return (
    <LandingShell>
      <div className="flex w-full flex-col gap-8 lg:sticky lg:top-20 lg:order-2 lg:max-w-sm lg:shrink-0">
        <LandingMark className="w-fit lg:hidden" />

        <LandingFormCard
          title="Sign in"
          description="Welcome back."
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
              <FormMessage tone="notice">
                Password updated. Sign in with your new password.
              </FormMessage>
            </div>
          ) : null}
          <SignInForm />
        </LandingFormCard>
      </div>

      <div className="flex min-w-0 flex-col gap-8 lg:order-1 lg:flex-1">
        <LandingMark className="hidden w-fit lg:inline-flex" />
        <LandingHero />
      </div>
    </LandingShell>
  );
}
