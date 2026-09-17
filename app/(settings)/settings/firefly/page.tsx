import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import {
  getAboutUser,
  getConfiguration,
  getFireflyUsers,
  getPreferences,
  getUserGroups,
} from '@/server/firefly/queries';
import { Card, CardContent } from '@/components/ui/card';
import { PreferenceRow } from './preference-row';

export const metadata: Metadata = { title: 'Firefly instance' };

/** Preferences known to be useful and safe to expose, with plain-English hints. */
const KNOWN: Record<string, string> = {
  'list-length': 'How many rows Firefly shows per page in its own UI.',
  currencyPreference: 'The currency Firefly defaults to.',
  language: 'Firefly’s interface language.',
  locale: 'How Firefly formats numbers and dates.',
  viewRange: 'The default period Firefly opens on.',
};

/**
 * E18-01 / E18-03 / E20-01 … E20-04 — the connected instance itself.
 *
 * Everything here belongs to Firefly rather than to this app: its preferences,
 * its configuration, its users. The admin sections only render for an instance
 * owner, which `/about/user` reports as `role`.
 */
export default async function FireflySettingsPage() {
  const session = await getSession();
  if (!session) redirect('/sign-in');
  const connection = await getActiveConnection();
  if (!connection) redirect('/onboarding');

  const [preferences, about] = await Promise.all([getPreferences(), getAboutUser()]);

  // E20-01 — only an owner sees instance administration, and only an owner can
  // read those endpoints anyway; asking as a non-owner would 401.
  const isOwner = about?.data.attributes.role === 'owner';
  const [configuration, users, groups] = isOwner
    ? await Promise.all([getConfiguration(), getFireflyUsers(), getUserGroups()])
    : [[], { data: [], meta: {} }, { data: [], meta: {} }];

  const editable = preferences.data.filter((entry) => entry.attributes.name in KNOWN);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Firefly instance</h1>
        <p className="text-muted-foreground text-sm">
          Settings that belong to the Firefly III you are connected to, not to Firefly Studio.
        </p>
      </header>

      <Card>
        <CardContent className="space-y-3 p-5">
          <p className="text-sm font-medium">Connection</p>
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground text-xs">Address</dt>
              <dd className="truncate font-mono text-xs">{connection.baseUrl}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Firefly version</dt>
              <dd>{connection.fireflyVersion ?? 'unknown'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Signed in there as</dt>
              <dd className="truncate">{about?.data.attributes.email ?? 'unknown'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Role</dt>
              <dd>{about?.data.attributes.role ?? 'unknown'}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {editable.length > 0 ? (
        <Card className="min-w-0 overflow-hidden">
          <CardContent className="p-0">
            <div className="border-b px-4 py-3">
              <p className="text-sm font-medium">Firefly preferences</p>
              <p className="text-muted-foreground text-xs">
                These change how Firefly III itself behaves.
              </p>
            </div>
            <div className="divide-border divide-y">
              {editable.map((entry) => (
                <PreferenceRow
                  key={entry.id}
                  name={entry.attributes.name}
                  value={
                    typeof entry.attributes.data === 'object'
                      ? JSON.stringify(entry.attributes.data)
                      : String(entry.attributes.data ?? '')
                  }
                  hint={KNOWN[entry.attributes.name]}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {isOwner ? (
        <>
          <Card className="min-w-0 overflow-hidden">
            <CardContent className="p-0">
              <div className="border-b px-4 py-3">
                <p className="text-sm font-medium">Users on this instance</p>
                <p className="text-muted-foreground text-xs">
                  {users.data.length} account{users.data.length === 1 ? '' : 's'}. Manage them in
                  Firefly III itself — this app only reads them.
                </p>
              </div>
              <ul className="divide-border divide-y">
                {users.data.map((user) => (
                  <li key={user.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <span className="min-w-0 flex-1 truncate text-sm">{user.attributes.email}</span>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {user.attributes.role ?? 'no role'}
                      {user.attributes.blocked ? ' · blocked' : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="min-w-0 overflow-hidden">
            <CardContent className="p-0">
              <div className="border-b px-4 py-3">
                <p className="text-sm font-medium">Financial administrations</p>
              </div>
              <ul className="divide-border divide-y">
                {groups.data.map((group) => (
                  <li
                    key={group.id}
                    className="flex items-center justify-between gap-3 px-4 py-2.5"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {group.attributes.title}
                    </span>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {group.attributes.primary_currency_code ?? ''}
                      {group.attributes.in_use ? ' · in use' : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {configuration.length > 0 ? (
            <Card className="min-w-0 overflow-hidden">
              <CardContent className="p-0">
                <div className="border-b px-4 py-3">
                  <p className="text-sm font-medium">Instance configuration</p>
                  <p className="text-muted-foreground text-xs">
                    Read-only here. These change how the whole instance behaves and belong in
                    Firefly III&rsquo;s own administration screen.
                  </p>
                </div>
                <ul className="divide-border divide-y">
                  {configuration.map((entry) => (
                    <li
                      key={entry.title}
                      className="flex items-center justify-between gap-3 px-4 py-2"
                    >
                      <span className="min-w-0 flex-1 truncate font-mono text-xs">
                        {entry.title.replace(/^configuration\./, '')}
                      </span>
                      {/* Several of these hold objects or arrays. `String()`
                          turns those into "[object Object]", which tells the
                          reader nothing; JSON at least shows the shape. */}
                      <span className="text-muted-foreground max-w-[55%] shrink-0 truncate text-right text-xs">
                        {entry.value !== null && typeof entry.value === 'object'
                          ? JSON.stringify(entry.value)
                          : String(entry.value)}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
