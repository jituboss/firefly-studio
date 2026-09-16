import { describe, expect, it } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn', () => {
  it('merges conflicting Tailwind utilities, last one winning', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-income', 'text-expense')).toBe('text-expense');
  });

  it('drops falsy values and flattens conditionals', () => {
    expect(cn('base', false && 'hidden', undefined, null, 'extra')).toBe('base extra');
  });
});
