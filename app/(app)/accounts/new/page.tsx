import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AccountForm } from '../account-form';

export const metadata: Metadata = { title: 'New account' };

export default function NewAccountPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <Link
        href="/accounts"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Accounts
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">New account</h1>
      <AccountForm />
    </div>
  );
}
