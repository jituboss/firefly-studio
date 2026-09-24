import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Flame,
  KeyRound,
  Layers,
  Lock,
  Smartphone,
  Sparkles,
  Wand2,
  Zap,
} from 'lucide-react';

/**
 * The landing page, which is also the sign-in page.
 *
 * Two audiences, one screen. Someone who already has an account wants the form
 * and nothing else, so on a phone the form sits in the first viewport and the
 * pitch is below it; on a wide screen they are side by side and neither has to
 * scroll. That ordering is the whole layout decision — a marketing page that
 * makes a returning user scroll past it every morning is a worse product.
 *
 * Everything here is static markup and CSS. No images, no animation library,
 * no client component: the page is served, painted, and done. The one moving
 * part is `fs-rise`, which the reduced-motion rules already neutralise.
 */

const FEATURES = [
  {
    icon: BarChart3,
    title: 'Reports that answer questions',
    body: 'Net worth over time, income against spending, a cash-flow Sankey, and a builder for the report nobody thought to ship. Export any of it to CSV or a formatted PDF.',
  },
  {
    icon: Zap,
    title: 'Entry that keeps up',
    body: 'Quick add, split transactions, bulk edit, drag-and-drop receipts, and a search that speaks Firefly’s own operators — with a warning when you mistype one.',
  },
  {
    icon: Wand2,
    title: 'Automation you can rehearse',
    body: 'Build a rule from conditions and actions, then dry-run it over real history and see exactly which transactions it would touch before anything changes.',
  },
  {
    icon: Layers,
    title: 'Every account, one view',
    body: 'Assets, liabilities, budgets, subscriptions, piggy banks and tags — with multi-currency handled honestly rather than summed into a number that means nothing.',
  },
  {
    icon: Smartphone,
    title: 'Installs like an app',
    body: 'Add it to a home screen and it runs without browser chrome. Offline it says so plainly, and it keeps none of your figures on the device to do it.',
  },
  {
    icon: Lock,
    title: 'Your ledger stays yours',
    body: 'Your data lives on your own Firefly III. Your access token is encrypted at rest and never reaches the browser — every call is proxied server-side.',
  },
] as const;

export function LandingHero() {
  return (
    <div className="fs-rise flex flex-col gap-8">
      <div className="space-y-5">
        <span className="border-border/70 bg-card/60 text-muted-foreground inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur">
          <Sparkles className="text-primary size-3.5" aria-hidden="true" />
          Open source · AGPL-3.0 · self-hosted
        </span>

        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Accounting that{' '}
          <span className="from-primary bg-gradient-to-r to-[var(--chart-5)] bg-clip-text text-transparent">
            keeps up with you
          </span>
          .
        </h1>

        <p className="text-muted-foreground max-w-xl text-base leading-relaxed text-pretty sm:text-lg">
          A modern front end for{' '}
          <strong className="text-foreground font-medium">Firefly III</strong>. Double-entry
          accounting, real reporting and rule-driven automation — in an interface fast enough to use
          every day.
        </p>
      </div>

      {/*
        A list, not a <dl>. This started as dt/dd pairs and axe was right to
        refuse them: a definition list requires dt and dd to be direct children
        of the <dl> or of a single wrapping <div>, and the icon needs a column
        of its own — so the pairs ended up two levels deep. They were never
        terms and definitions anyway; they are six features.
      */}
      <ul className="grid gap-5 sm:grid-cols-2">
        {FEATURES.map((feature) => (
          <li key={feature.title} className="flex gap-3">
            <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
              <feature.icon className="size-4.5" aria-hidden="true" />
            </span>
            <span className="space-y-1">
              <span className="block text-sm font-medium">{feature.title}</span>
              <span className="text-muted-foreground block text-sm leading-relaxed">
                {feature.body}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <p className="text-muted-foreground border-border/70 border-t pt-6 text-sm">
        Firefly Studio does not replace Firefly III — it connects to the instance you already run,
        and changes nothing about where your data lives.{' '}
        <Link
          href="https://github.com/jituboss/firefly-studio"
          target="_blank"
          rel="noreferrer noopener"
          className="text-foreground inline-flex items-center gap-1 underline underline-offset-4"
        >
          Read the source
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </p>
    </div>
  );
}

/**
 * The page frame: a soft field of brand colour behind everything, and the
 * two-column split from `lg` up.
 *
 * The gradients are `oklch` tokens at low alpha rather than fixed colours, so
 * the same markup is right in both themes without a second set of values to
 * keep in step — and `pointer-events-none` on the backdrop so it can never
 * swallow a click meant for the form.
 */
export function LandingShell({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="relative min-h-svh overflow-x-clip">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="from-primary/12 absolute inset-x-0 top-0 h-[38rem] bg-gradient-to-b to-transparent" />
        <div className="bg-primary/10 absolute -top-40 -left-32 size-[34rem] rounded-full blur-3xl" />
        <div className="absolute -top-24 right-0 size-[26rem] rounded-full bg-[var(--chart-5)]/10 blur-3xl" />
      </div>

      {/*
        `items-start`, not `items-center`: the pitch column is much taller than
        the form, and centring against it pushed the card a third of the way
        down a 980px screen with nothing above it. Aligning to the top also
        lets the card stick, so it stays in view while the features scroll.
      */}
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:flex-row lg:items-start lg:gap-16 lg:py-20">
        {children}
      </div>
    </main>
  );
}

/** The wordmark, shown above the form on a phone and above the pitch on desktop. */
export function LandingMark({ className }: { className?: string }) {
  return (
    <Link href="/" className={className}>
      <span className="inline-flex items-center gap-2">
        <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg shadow-sm">
          <Flame className="size-4.5" aria-hidden="true" />
        </span>
        <span className="text-[0.95rem] font-semibold tracking-tight">Firefly Studio</span>
      </span>
    </Link>
  );
}

/** The card the form sits in. */
export function LandingFormCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="fs-rise w-full lg:max-w-sm lg:shrink-0">
      <div className="bg-card/95 rounded-2xl border p-6 shadow-xl backdrop-blur-sm sm:p-7">
        <div className="mb-5 space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
        </div>
        {children}
      </div>

      {footer ? (
        <div className="text-muted-foreground mt-5 text-center text-sm">{footer}</div>
      ) : null}

      <p className="text-muted-foreground/80 mt-6 flex items-center justify-center gap-1.5 text-center text-xs">
        <KeyRound className="size-3.5" aria-hidden="true" />
        Your Firefly token is encrypted and never reaches the browser
      </p>
    </div>
  );
}
