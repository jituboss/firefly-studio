'use client';

import { MIN_PASSWORD_LENGTH, STRENGTH_LABELS, scorePassword } from '@/lib/password-strength';

/**
 * E2-27 — a four-segment strength meter.
 *
 * Scores through `lib/password-strength.ts`, the same function the Server
 * Action enforces with. The sign-up form used to reimplement the rules inline,
 * which meant the meter could show three bars for a password the server then
 * rejected.
 *
 * Colour is not the only signal: the label below states the score in words,
 * and `aria-live` announces it as it changes.
 */
export function StrengthMeter({ password }: { password: string }) {
  const { score, problems } = scorePassword(password);
  const empty = password.length === 0;

  const segmentClass = (index: number) => {
    if (empty || index >= score) return 'bg-muted';
    if (score <= 1) return 'bg-expense';
    if (score <= 2) return 'bg-warning';
    return 'bg-income';
  };

  return (
    <div className="space-y-1">
      <div className="flex gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((index) => (
          <span key={index} className={`h-1 flex-1 rounded-full ${segmentClass(index)}`} />
        ))}
      </div>
      <p className="text-muted-foreground text-xs" aria-live="polite">
        {empty
          ? `At least ${MIN_PASSWORD_LENGTH} characters.`
          : // Show the blocking reason rather than a bare "Weak" — "Weak" does
            // not tell anyone what to change.
            (problems[0] ?? STRENGTH_LABELS[score])}
      </p>
    </div>
  );
}
