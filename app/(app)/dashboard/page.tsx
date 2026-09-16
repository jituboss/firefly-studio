import type { Metadata } from 'next';
import { CheckCircle2, CircleDashed } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Amount } from '@/components/ui/amount';
import {
  FIREFLY_OPERATION_COUNT,
  FIREFLY_PATH_COUNT,
  FIREFLY_SPEC_VERSION,
  FIREFLY_TAGS,
} from '@/spec/generated/operations';

export const metadata: Metadata = { title: 'Dashboard' };

/**
 * M0 placeholder. This route exists to prove the shell, theming, token layer and
 * money primitives render correctly end to end. E3-04 … E3-15 replace the body
 * with real widgets backed by /summary/basic and /chart/balance/balance.
 */

const MILESTONES = [
  { id: 'M0', label: 'Foundation', done: true },
  { id: 'M1', label: 'Auth & onboarding', done: false },
  { id: 'M2', label: 'Read core', done: false },
  { id: 'M3', label: 'Write core', done: false },
  { id: 'M4', label: 'Money management', done: false },
  { id: 'M5', label: 'Reporting', done: false },
  { id: 'M6', label: 'Automation', done: false },
  { id: 'M7', label: 'Polish', done: false },
  { id: 'M8', label: 'Hardening & launch', done: false },
];

/** Sample values only — nothing here touches a Firefly instance yet. */
const TOKEN_PREVIEW = [
  { label: 'Income', value: '4820.00', tone: 'income' as const },
  { label: 'Expense', value: '-3155.42', tone: 'expense' as const },
  { label: 'Transfer', value: '1200.00', tone: 'transfer' as const },
  { label: 'Net', value: '1664.58', tone: 'auto' as const },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Foundation milestone is in place. Connect a Firefly III instance in M1 to see real
          figures.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Vendored API surface</CardTitle>
          <CardDescription>
            Generated from <code className="font-mono text-xs">spec/firefly-iii-v1.yaml</code> at
            build time.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          {[
            { label: 'Firefly III', value: FIREFLY_SPEC_VERSION },
            { label: 'Paths', value: String(FIREFLY_PATH_COUNT) },
            { label: 'Operations', value: String(FIREFLY_OPERATION_COUNT) },
            { label: 'Resource groups', value: String(FIREFLY_TAGS.length) },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {stat.label}
              </p>
              <p className="tabular mt-1 text-2xl font-semibold tracking-tight">{stat.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Money primitives</CardTitle>
            <CardDescription>
              Tabular numerals, sign glyphs, and a screen-reader label on every amount — colour
              never carries meaning alone.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {TOKEN_PREVIEW.map((row) => (
              <div
                key={row.label}
                className="border-border flex items-center justify-between border-b py-2 last:border-0"
              >
                <span className="text-muted-foreground text-sm">{row.label}</span>
                <Amount value={row.value} currency="EUR" tone={row.tone} size="lg" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery progress</CardTitle>
            <CardDescription>Milestones from PROJECT_PLAN.md §6.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {MILESTONES.map((milestone) => (
                <li key={milestone.id} className="flex items-center gap-2.5 text-sm">
                  {milestone.done ? (
                    <CheckCircle2 className="text-income size-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <CircleDashed
                      className="text-muted-foreground size-4 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <span className={milestone.done ? '' : 'text-muted-foreground'}>
                    {milestone.label}
                  </span>
                  <Badge variant={milestone.done ? 'income' : 'secondary'} className="ml-auto">
                    {milestone.id}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
