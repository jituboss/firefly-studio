import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Liveness (E25-03). Deliberately has NO dependencies: if this fails, the
 * process itself is wedged and the orchestrator should restart it. A database
 * outage must not cause a restart loop — that is what /api/ready is for.
 */
export function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'firefly-studio',
      uptimeSeconds: Math.round(process.uptime()),
    },
    { headers: { 'cache-control': 'no-store' } },
  );
}
