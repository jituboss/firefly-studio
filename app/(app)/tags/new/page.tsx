import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { TagForm } from '../tag-form';

export const metadata: Metadata = { title: 'New tag' };

export default async function NewTagPage() {
  const session = await getSession();
  if (!session) redirect('/sign-in');
  const connection = await getActiveConnection();
  if (!connection) redirect('/onboarding');

  return (
    <div className="mx-auto w-full max-w-2xl min-w-0 space-y-6">
      <div className="space-y-1">
        <Link
          href="/tags"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Tags
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">New tag</h1>
      </div>
      <TagForm />
    </div>
  );
}
