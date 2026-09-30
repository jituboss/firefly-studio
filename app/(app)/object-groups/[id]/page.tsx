import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, PiggyBank, Receipt } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import {
  getObjectGroup,
  getObjectGroupBills,
  getObjectGroupPiggyBanks,
} from '@/server/firefly/queries';
import {
  deleteObjectGroupAction,
  updateObjectGroupAction,
} from '@/server/firefly/object-group-actions';
import { Amount } from '@/components/ui/amount';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmButton } from '@/components/ui/confirm';
import { Input, Label } from '@/components/ui/input';

export const metadata: Metadata = { title: 'Object group' };

/**
 * E9-05 — one object group: what is in it, rename, delete. The list page has
 * linked here since it shipped; the page itself did not exist.
 */
export default async function ObjectGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect('/sign-in');
  const connection = await getActiveConnection();
  if (!connection) redirect('/onboarding');

  const { id } = await params;
  let group;
  try {
    group = (await getObjectGroup(id)).data;
  } catch {
    notFound();
  }

  const [bills, piggies] = await Promise.all([
    getObjectGroupBills(id),
    getObjectGroupPiggyBanks(id),
  ]);
  const members = bills.data.length + piggies.data.length;

  async function rename(formData: FormData) {
    'use server';
    const title = String(formData.get('title') ?? '').trim();
    if (!title) return;
    await updateObjectGroupAction(id, { title });
    redirect(`/object-groups/${id}`);
  }

  async function remove() {
    'use server';
    await deleteObjectGroupAction(id);
    redirect('/object-groups');
  }

  return (
    <div className="mx-auto w-full max-w-3xl min-w-0 space-y-6">
      <Link
        href="/object-groups"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Object groups
      </Link>

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{group.attributes.title}</h1>
        <p className="text-muted-foreground text-sm">
          {members === 0
            ? 'Empty. Assign subscriptions or piggy banks from their own edit forms.'
            : `${bills.data.length} subscription${bills.data.length === 1 ? '' : 's'} · ${piggies.data.length} piggy bank${piggies.data.length === 1 ? '' : 's'}`}
        </p>
      </header>

      {bills.data.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subscriptions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-border divide-y border-t">
              {bills.data.map((bill) => (
                <li key={bill.id}>
                  <Link
                    href={`/bills/${bill.id}`}
                    className="hover:bg-accent/50 flex items-center gap-3 px-4 py-3"
                  >
                    <Receipt className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {bill.attributes.name}
                    </span>
                    <Amount
                      value={bill.attributes.amount_max}
                      currency={bill.attributes.currency_code ?? connection.primaryCurrency}
                      showSign={false}
                      size="sm"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {piggies.data.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Piggy banks</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-border divide-y border-t">
              {piggies.data.map((piggy) => (
                <li key={piggy.id}>
                  <Link
                    href={`/piggy-banks/${piggy.id}`}
                    className="hover:bg-accent/50 flex items-center gap-3 px-4 py-3"
                  >
                    <PiggyBank
                      className="text-muted-foreground size-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {piggy.attributes.name}
                    </span>
                    {piggy.attributes.target_amount ? (
                      <Amount
                        value={piggy.attributes.target_amount}
                        currency={piggy.attributes.currency_code ?? connection.primaryCurrency}
                        showSign={false}
                        size="sm"
                      />
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rename</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={rename} className="flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required defaultValue={group.attributes.title} />
            </div>
            <Button type="submit" variant="outline">
              Save
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="min-w-0">
            <p className="text-sm font-medium">Delete this group</p>
            <p className="text-muted-foreground text-sm">
              Its subscriptions and piggy banks are kept; they just stop being grouped.
            </p>
          </div>
          <form action={remove}>
            <ConfirmButton
              message={`Delete the group "${group.attributes.title}"? Its members are not deleted.`}
              confirmLabel="Delete group"
              pendingLabel="Deleting…"
            >
              Delete group
            </ConfirmButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
