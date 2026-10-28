'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileUp,
  Flame,
  LayoutDashboard,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { runSetupAction, type SetupResult } from '@/server/setup/actions';
import {
  ACCOUNT_PRESETS,
  BUDGET_PRESETS,
  COMMON_CURRENCIES,
  ROLE_LABELS,
  planTotals,
  suggestBudget,
  validateSetup,
  type SetupAccount,
  type SetupAccountRole,
  type SetupBudget,
} from '@/lib/setup';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Amount } from '@/components/ui/amount';
import { FormMessage } from '@/components/auth/form-shell';

const STEPS = ['Currency', 'Accounts', 'Monthly plan', 'Done'] as const;

function Stepper({ current }: { current: number }) {
  return (
    <ol className="mb-8 flex items-center gap-2" aria-label="Setup progress">
      {STEPS.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              aria-current={active ? 'step' : undefined}
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium',
                done
                  ? 'bg-income text-income-foreground'
                  : active
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
              )}
            >
              {done ? <Check className="size-3.5" aria-hidden="true" /> : index + 1}
            </span>
            <span
              className={cn(
                'hidden text-sm sm:inline',
                active ? 'font-medium' : 'text-muted-foreground',
              )}
            >
              {label}
            </span>
            {index < STEPS.length - 1 ? <span className="bg-border h-px flex-1" /> : null}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * The first-run setup for an empty ledger (lib/setup.ts): a currency, where
 * your money lives, and a plan for the month — three short screens, then a
 * finish line that points at the two things worth doing next.
 *
 * Nothing is written until the last screen's button, so going back and forth
 * is free, and the whole setup lands in one server action that reports per
 * item.
 */
export function SetupWizard({
  suggestedCurrency,
  currentCurrency,
  timezone,
  existingAccounts,
  managed,
}: {
  suggestedCurrency: string | null;
  currentCurrency: string;
  timezone: string;
  /** Your own accounts already in the ledger, if any — the setup never duplicates them. */
  existingAccounts: string[];
  managed: boolean;
}) {
  const [step, setStep] = React.useState(0);
  const [currency, setCurrency] = React.useState(suggestedCurrency ?? currentCurrency);
  const [accounts, setAccounts] = React.useState<SetupAccount[]>(() =>
    ACCOUNT_PRESETS.map((preset) => ({
      key: preset.key,
      name: preset.name,
      role: preset.role,
      balance: '',
      enabled:
        preset.enabled &&
        !existingAccounts.some((name) => name.toLowerCase() === preset.name.toLowerCase()),
    })),
  );
  const [income, setIncome] = React.useState({ amount: '', from: '' });
  const [budgets, setBudgets] = React.useState<SetupBudget[]>(() =>
    BUDGET_PRESETS.map((preset) => ({
      key: preset.key,
      name: preset.name,
      amount: '',
      enabled: preset.enabled,
    })),
  );
  // Amounts the user typed themselves are theirs; the rest follow the income.
  const [typed, setTyped] = React.useState<Set<string>>(new Set());
  const [pending, startTransition] = React.useTransition();
  const [result, setResult] = React.useState<SetupResult | null>(null);

  const currencies = [
    ...new Set(
      [suggestedCurrency, currentCurrency, ...COMMON_CURRENCIES].filter((code): code is string =>
        Boolean(code),
      ),
    ),
  ];

  function changeIncome(amount: string) {
    setIncome((current) => ({ ...current, amount }));
    setBudgets((current) =>
      current.map((budget) => {
        if (typed.has(budget.key)) return budget;
        const preset = BUDGET_PRESETS.find((entry) => entry.key === budget.key);
        return preset ? { ...budget, amount: suggestBudget(amount, preset.share) } : budget;
      }),
    );
  }

  const input = { currency, accounts, income, budgets };
  const problems = validateSetup(input);
  const totals = planTotals(income.amount || '0', budgets);

  function submit() {
    startTransition(async () => {
      const outcome = await runSetupAction(input);
      setResult(outcome);
      if (outcome.ok) setStep(3);
    });
  }

  return (
    <main id="main" className="bg-background min-h-svh px-4 py-10">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-8 flex items-center justify-center gap-2">
          <Flame className="text-primary size-5" aria-hidden="true" />
          <span className="font-semibold tracking-tight">Firefly Studio</span>
        </div>

        <Stepper current={step} />

        <div className="bg-card rounded-xl border p-6 shadow-sm">
          {step === 0 ? (
            <section className="space-y-5">
              <header className="space-y-1">
                <h1 className="text-lg font-semibold tracking-tight">
                  {managed ? 'Your ledger is ready. Let’s set it up.' : 'Let’s set up your ledger.'}
                </h1>
                <p className="text-muted-foreground text-sm">
                  Three quick questions — the currency you use, where your money lives, and a plan
                  for the month. About two minutes, and everything can be changed later.
                </p>
              </header>

              <div className="space-y-1.5">
                <Label htmlFor="currency">Which currency do you use?</Label>
                <Select
                  id="currency"
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value)}
                >
                  {currencies.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </Select>
                {suggestedCurrency ? (
                  <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <Sparkles className="size-3.5" aria-hidden="true" />
                    {suggestedCurrency} suggested from your timezone ({timezone}).
                  </p>
                ) : null}
              </div>
            </section>
          ) : null}

          {step === 1 ? (
            <section className="space-y-5">
              <header className="space-y-1">
                <h1 className="text-lg font-semibold tracking-tight">
                  Where does your money live?
                </h1>
                <p className="text-muted-foreground text-sm">
                  Tick what you have and enter today’s balance — that is where your ledger starts.
                  Rename them to match your bank if you like.
                </p>
              </header>

              {existingAccounts.length > 0 ? (
                <p className="bg-muted rounded-md px-3 py-2 text-sm">
                  Already in your ledger: {existingAccounts.join(', ')}. Those are kept as they are.
                </p>
              ) : null}

              <ul className="space-y-2">
                {accounts.map((account, index) => (
                  <AccountRow
                    key={account.key}
                    account={account}
                    currency={currency}
                    onChange={(next) =>
                      setAccounts((current) => current.map((a, i) => (i === index ? next : a)))
                    }
                    onRemove={
                      account.key.startsWith('custom-')
                        ? () => setAccounts((current) => current.filter((_, i) => i !== index))
                        : undefined
                    }
                  />
                ))}
              </ul>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setAccounts((current) => [
                    ...current,
                    {
                      key: `custom-${current.length}-${Date.now()}`,
                      name: '',
                      role: 'defaultAsset',
                      balance: '',
                      enabled: true,
                    },
                  ])
                }
              >
                <Plus className="size-4" aria-hidden="true" />
                Add another account
              </Button>
            </section>
          ) : null}

          {step === 2 ? (
            <section className="space-y-5">
              <header className="space-y-1">
                <h1 className="text-lg font-semibold tracking-tight">Plan your month</h1>
                <p className="text-muted-foreground text-sm">
                  Tell us roughly what comes in and we’ll suggest a split. Each budget renews every
                  month on its own.
                </p>
              </header>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="income">Monthly income, after tax</Label>
                  <CurrencyInput
                    id="income"
                    currency={currency}
                    placeholder="Optional"
                    value={income.amount}
                    onChange={(event) => changeIncome(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="income-from">Paid by</Label>
                  <Input
                    id="income-from"
                    placeholder="Your employer (optional)"
                    value={income.from}
                    onChange={(event) =>
                      setIncome((current) => ({ ...current, from: event.target.value }))
                    }
                  />
                </div>
              </div>

              <ul className="divide-y rounded-md border">
                {budgets.map((budget, index) => {
                  const preset = BUDGET_PRESETS.find((entry) => entry.key === budget.key);
                  return (
                    <li key={budget.key} className="flex items-center gap-3 px-3 py-2.5">
                      <input
                        type="checkbox"
                        className="size-4 shrink-0"
                        aria-label={`Include ${budget.name || 'this budget'}`}
                        checked={budget.enabled}
                        onChange={(event) =>
                          setBudgets((current) =>
                            current.map((b, i) =>
                              i === index ? { ...b, enabled: event.target.checked } : b,
                            ),
                          )
                        }
                      />
                      <span className="min-w-0 flex-1">
                        {preset ? (
                          <>
                            <span className="block text-sm font-medium">{budget.name}</span>
                            <span className="text-muted-foreground block truncate text-xs">
                              {preset.hint}
                            </span>
                          </>
                        ) : (
                          <Input
                            aria-label="Budget name"
                            placeholder="Budget name"
                            className="h-8"
                            value={budget.name}
                            onChange={(event) =>
                              setBudgets((current) =>
                                current.map((b, i) =>
                                  i === index ? { ...b, name: event.target.value } : b,
                                ),
                              )
                            }
                          />
                        )}
                      </span>
                      <CurrencyInput
                        aria-label={`Monthly amount for ${budget.name || 'this budget'}`}
                        currency={currency}
                        placeholder="No limit"
                        className="h-8 w-32 text-right"
                        disabled={!budget.enabled}
                        value={budget.amount}
                        onChange={(event) => {
                          const amount = event.target.value;
                          setTyped((current) => new Set(current).add(budget.key));
                          setBudgets((current) =>
                            current.map((b, i) => (i === index ? { ...b, amount } : b)),
                          );
                        }}
                      />
                      {!preset ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Remove this budget"
                          onClick={() =>
                            setBudgets((current) => current.filter((_, i) => i !== index))
                          }
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setBudgets((current) => [
                    ...current,
                    {
                      key: `custom-${current.length}-${Date.now()}`,
                      name: '',
                      amount: '',
                      enabled: true,
                    },
                  ])
                }
              >
                <Plus className="size-4" aria-hidden="true" />
                Add a budget
              </Button>

              {income.amount.trim() ? (
                <div className="bg-muted/50 space-y-2 rounded-md p-3">
                  <ProgressBar
                    value={Math.min(totals.percent, 100)}
                    over={totals.percent > 100}
                    label="Share of income planned"
                  />
                  <p className="text-sm">
                    <Amount
                      value={totals.planned}
                      currency={currency}
                      tone="neutral"
                      size="sm"
                      showSign={false}
                    />{' '}
                    planned · {totals.percent}% of your income.{' '}
                    {totals.percent <= 100 ? (
                      <>
                        <Amount
                          value={totals.left}
                          currency={currency}
                          tone="income"
                          size="sm"
                          showSign={false}
                        />{' '}
                        left to save.
                      </>
                    ) : (
                      <span className="text-expense">That is more than comes in.</span>
                    )}
                  </p>
                </div>
              ) : null}
            </section>
          ) : null}

          {step === 3 && result?.ok ? <Done result={result} /> : null}

          {step < 3 ? (
            <div className="mt-6 space-y-3">
              {result && !result.ok && result.problems ? (
                <FormMessage tone="error">{result.problems.join(' ')}</FormMessage>
              ) : null}
              {step === 2 && problems.length > 0 ? (
                <FormMessage tone="error">{problems.join(' ')}</FormMessage>
              ) : null}
              <div className="flex items-center gap-2">
                {step > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep(step - 1)}
                    disabled={pending}
                  >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Back
                  </Button>
                ) : null}
                <Link
                  href="/dashboard"
                  className="text-muted-foreground hover:text-foreground ml-auto text-sm whitespace-nowrap underline-offset-4 hover:underline"
                >
                  Skip for now
                </Link>
                {step < 2 ? (
                  <Button
                    type="button"
                    onClick={() => setStep(step + 1)}
                    disabled={
                      step === 1 &&
                      !accounts.some((account) => account.enabled && account.role !== 'loan')
                    }
                  >
                    Next
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Button>
                ) : (
                  <Button type="button" onClick={submit} disabled={pending || problems.length > 0}>
                    {pending ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : null}
                    {pending ? 'Setting up…' : 'Set up my ledger'}
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}

const ROLE_OPTIONS: SetupAccountRole[] = [
  'defaultAsset',
  'savingAsset',
  'cashWalletAsset',
  'ccAsset',
  'loan',
];

function AccountRow({
  account,
  currency,
  onChange,
  onRemove,
}: {
  account: SetupAccount;
  currency: string;
  onChange: (account: SetupAccount) => void;
  onRemove?: () => void;
}) {
  const preset = ACCOUNT_PRESETS.find((entry) => entry.key === account.key);
  const owes = account.role === 'ccAsset' || account.role === 'loan';
  return (
    <li
      className={cn(
        'rounded-lg border p-3 transition-colors',
        account.enabled ? 'border-primary/40 bg-primary/5' : 'opacity-80',
      )}
    >
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          className="mt-0.5 size-4"
          checked={account.enabled}
          onChange={(event) => onChange({ ...account, enabled: event.target.checked })}
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{preset?.title ?? 'Another account'}</span>
          <span className="text-muted-foreground block text-xs">
            {preset?.hint ?? 'A second bank, a mobile wallet, a card — anything that holds money.'}
          </span>
        </span>
        {onRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remove this account"
            onClick={onRemove}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        ) : null}
      </label>

      {account.enabled ? (
        <div className="mt-3 grid gap-2 pl-7 sm:grid-cols-[1fr_9rem]">
          <div className="space-y-1">
            <Label htmlFor={`name-${account.key}`} className="text-xs">
              Name
            </Label>
            <div className="flex gap-2">
              <Input
                id={`name-${account.key}`}
                className="h-8"
                placeholder="e.g. City Bank"
                value={account.name}
                onChange={(event) => onChange({ ...account, name: event.target.value })}
              />
              {!preset ? (
                <Select
                  aria-label="Kind of account"
                  className="h-8 w-36"
                  value={account.role}
                  onChange={(event) =>
                    onChange({ ...account, role: event.target.value as SetupAccountRole })
                  }
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </Select>
              ) : null}
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`balance-${account.key}`} className="text-xs">
              {preset?.balanceLabel ?? (owes ? 'Owed today' : 'Balance today')}
            </Label>
            <CurrencyInput
              id={`balance-${account.key}`}
              currency={currency}
              className="h-8 text-right"
              placeholder="0.00"
              value={account.balance}
              onChange={(event) => onChange({ ...account, balance: event.target.value })}
            />
          </div>
        </div>
      ) : null}
    </li>
  );
}

function Done({ result }: { result: SetupResult }) {
  const created = result.created!;
  const lines = [
    created.currency ? `Currency set to ${created.currency}` : null,
    created.accounts.length > 0
      ? `${created.accounts.length} account${created.accounts.length === 1 ? '' : 's'}: ${created.accounts.join(', ')}`
      : null,
    created.budgets.length > 0
      ? `${created.budgets.length} monthly budget${created.budgets.length === 1 ? '' : 's'}: ${created.budgets.join(', ')}`
      : null,
    created.categories.length > 0
      ? `${created.categories.length} categories to file things under`
      : null,
    created.payer ? `${created.payer}, ready for your first pay day` : null,
  ].filter((line): line is string => Boolean(line));

  return (
    <section className="space-y-5">
      <header className="space-y-2 text-center">
        <span className="bg-income-muted text-income mx-auto flex size-12 items-center justify-center rounded-full">
          <Check className="size-6" aria-hidden="true" />
        </span>
        <h1 className="text-lg font-semibold tracking-tight">Your ledger is set up</h1>
      </header>

      {lines.length > 0 ? (
        <ul className="space-y-1.5 text-sm">
          {lines.map((line) => (
            <li key={line} className="flex items-start gap-2">
              <Check className="text-income mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {line}
            </li>
          ))}
        </ul>
      ) : null}
      {result.kept && result.kept.length > 0 ? (
        <p className="text-muted-foreground text-xs">
          Kept as they were: {result.kept.join(', ')}.
        </p>
      ) : null}
      {result.failed && result.failed.length > 0 ? (
        <FormMessage tone="error">{`Some things could not be created: ${result.failed.join(' · ')}`}</FormMessage>
      ) : null}

      <div className="space-y-2">
        <p className="text-sm font-medium">What next?</p>
        <NextStep
          href="/transactions/import"
          icon={FileUp}
          title="Bring in your history"
          description="Fill in a spreadsheet of past transactions — the import files them against what you just set up."
        />
        <NextStep
          href="/dashboard"
          icon={LayoutDashboard}
          title="Go to your dashboard"
          description="Record today’s spending with Add, and watch the month take shape."
          primary
        />
      </div>
    </section>
  );
}

function NextStep({
  href,
  icon: Icon,
  title,
  description,
  primary = false,
}: {
  href: '/transactions/import' | '/dashboard';
  icon: typeof FileUp;
  title: string;
  description: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg border p-3 transition-colors',
        primary ? 'border-primary/50 bg-primary/5 hover:bg-primary/10' : 'hover:bg-accent/40',
      )}
    >
      <Icon className="text-primary size-5 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span className="text-muted-foreground block text-xs">{description}</span>
      </span>
      <ArrowRight className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
    </Link>
  );
}
