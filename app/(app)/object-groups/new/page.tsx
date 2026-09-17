import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { createObjectGroupAction } from '@/server/firefly/object-group-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Label } from '@/components/ui/input';

export const metadata: Metadata = { title: 'New object group' };

/** E9-05 — create a new object group. */
export default async function NewObjectGroupPage() {
  const session = await getSession();
  if (!session) redirect('/sign-in');
  const connection = await getActiveConnection();
  if (!connection) redirect('/onboarding');

  async function create(formData: FormData) {
    'use server';
    const title = String(formData.get('title') ?? '').trim();
    if (!title) return;
    await createObjectGroupAction({ title });
    redirect('/object-groups');
  }

  return (
    <div className="mx-auto w-full max-w-xl min-w-0 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">New object group</h1>
      <form action={create} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Group details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required autoFocus />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="submit">Create group</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
