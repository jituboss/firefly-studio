import { NextResponse } from 'next/server';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { loadAccounts } from '@/server/import/firefly';
import { buildTemplate } from '@/server/import/workbook';
import { now, toApiDate } from '@/lib/date';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The import template. Its three sample rows use the ledger's own asset
 * accounts when there are any; an empty ledger gets stand-in names, which the
 * import will recognise as accounts of yours from the way money moves.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const connection = await getActiveConnection();
  if (!connection) return NextResponse.json({ error: 'No Firefly connection' }, { status: 409 });

  // The samples are a nicety; a ledger that cannot be read still gets a template.
  const assets = await loadAccounts()
    .then((accounts) =>
      accounts.filter((account) => account.kind === 'asset' && account.active).map((a) => a.name),
    )
    .catch(() => [] as string[]);
  const savings = assets.find((name) => /sav/i.test(name) && name !== assets[0]);

  const today = toApiDate(now(session.user.timezone), session.user.timezone);
  const month = today.slice(0, 8);
  const file = await buildTemplate({
    account: assets[0] ?? 'My Bank Account',
    savings: savings ?? assets[1] ?? 'Savings Account',
    dates: [`${month}01`, `${month}02`, `${month}03`],
  });
  return new NextResponse(new Uint8Array(file), {
    headers: {
      'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'content-disposition': 'attachment; filename="firefly-import-template.xlsx"',
      'cache-control': 'no-store',
    },
  });
}
