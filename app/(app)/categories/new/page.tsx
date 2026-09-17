import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CategoryForm } from '../category-form';

export const metadata: Metadata = { title: 'New category' };

export default function NewCategoryPage() {
  return (
    <div className="mx-auto w-full max-w-2xl min-w-0 space-y-6">
      <Link
        href="/categories"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Categories
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">New category</h1>
      <CategoryForm />
    </div>
  );
}
