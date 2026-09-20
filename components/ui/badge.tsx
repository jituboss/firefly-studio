import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'text-foreground',
        income: 'border-transparent bg-income-muted text-income',
        expense: 'border-transparent bg-expense-muted text-expense',
        transfer: 'border-transparent bg-transfer-muted text-transfer',
        // `text-warning`, not `text-warning-foreground`: the -foreground token
        // is the near-white that sits on the SOLID --warning fill, and putting
        // it on the pale --warning-muted tint left it barely visible in either
        // theme. The other three tinted badges had it right; this one was the
        // odd one out. axe only caught it once a connection went unhealthy,
        // because that is the sole place this variant renders.
        warning: 'border-transparent bg-warning-muted text-warning',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
