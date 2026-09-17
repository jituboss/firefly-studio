import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Folder, Plus } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { getObjectGroups } from '@/server/firefly/queries';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Object groups' };

/** E9-05 — list object groups used to cluster bills and piggy banks. */
export default async function ObjectGroupsPage() {
  const session = await getSession();
  if (!session) redirect('/sign-in');
  const connection = await getActiveConnection();
  if (!connection) redirect('/onboarding');

  const result = await getObjectGroups();
  const groups = [...result.data].sort((a, b) =>
    a.attributes.title.localeCompare(b.attributes.title),
  );

  return (
    <div className="mx-auto w-full max-w-4xl min-w-0 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Object groups</h1>
          <p className="text-muted-foreground truncate text-sm">
            {groups.length} group{groups.length === 1 ? '' : 's'}
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/object-groups/new">
            <Plus className="size-4" aria-hidden="true" />
            New group
          </Link>
        </Button>
      </header>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Folder className="text-muted-foreground mx-auto size-8" aria-hidden="true" />
            <p className="text-muted-foreground mt-3 text-sm">No object groups yet.</p>
            <p className="text-muted-foreground text-xs">
              Groups are created in Firefly III when you assign them to a piggy bank or bill.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-border divide-y">
              {groups.map((group) => (
                <li key={group.id}>
                  <Link
                    href={`/object-groups/${group.id}`}
                    className="hover:bg-accent/50 flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">
                      {group.attributes.title}
                    </p>
                    <p className="text-muted-foreground text-xs">Order {group.attributes.order}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
