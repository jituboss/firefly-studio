'use client';

import * as React from 'react';
import { Braces, CircleAlert, Lightbulb, Undo2 } from 'lucide-react';
import {
  checkExpression,
  escapeLiteral,
  EXPRESSION_FIELDS,
  EXPRESSION_FUNCTIONS,
  previewExpression,
  unescapeLiteral,
  valueMode,
} from '@/lib/rule-expressions';
import type { Keyword } from '@/lib/rule-vocabulary';
import { TRANSACTION_TYPES } from '@/lib/rule-vocabulary';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Popover } from '@/components/ui/popover';
import { Select } from '@/components/ui/select';

/**
 * E11-09 — the value side of one rule row.
 *
 * Two things were missing here and they turn out to be the same thing.
 *
 * **Autocomplete was on one keyword out of seventeen.** `link_to_bill` had a
 * picker because Firefly hard-validates it; everything else got a bare text box,
 * so "Set category to" was a spelling test whose only feedback was a rule that
 * quietly did nothing. Every keyword that names a whole category, budget, tag,
 * account or subscription now carries its `/autocomplete/*` endpoint in the
 * vocabulary and gets a picker from it. The `_contains`/`_starts`/`_ends`
 * triggers deliberately do not: they match a fragment, and a list of complete
 * names in front of a box that wants "Amaz" is a picker that is wrong about its
 * own job.
 *
 * **Expressions were invisible.** A value beginning with `=` is not text —
 * Firefly evaluates it against the transaction's own fields — and nothing on
 * screen said so, offered the field names, or showed what it would produce.
 * Typing one worked by accident if you already knew; getting it slightly wrong
 * cost a round trip and a 422.
 *
 * They meet in one control because they are alternatives: the moment a value
 * starts with `=` it is no longer a category name, so the picker steps aside for
 * the expression editor and steps back when the `=` goes away.
 */
export function RuleValueField({
  name,
  keyword,
  value,
  onChange,
  label,
}: {
  /** The form field name, e.g. `actions[0][value]`. */
  name: string;
  keyword: Keyword | undefined;
  value: string;
  onChange: (value: string) => void;
  /**
   * What this value belongs to, e.g. "Action 2". Every row on this page is a
   * select and a box with no visible labels, so "Value" repeated eight times is
   * what a screen reader would otherwise read out.
   */
  label: string;
}) {
  const mode = valueMode(value);

  // Only actions are evaluated. `RuleAction::getValue()` is the only caller of
  // the expression engine; a trigger's value is matched literally however it
  // begins, so offering expression help on one would be a lie.
  const evaluated = name.startsWith('actions');

  if (keyword?.kind === 'transaction-type') {
    return (
      <Select
        name={name}
        value={value || TRANSACTION_TYPES[0]}
        onChange={(event) => onChange(event.target.value)}
        className="border-input bg-background w-full rounded-md border px-2 py-1.5 text-sm"
        aria-label={label}
      >
        {TRANSACTION_TYPES.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </Select>
    );
  }

  const expressionish = evaluated && (mode === 'expression' || mode === 'escaped');

  return (
    <div className="min-w-0 space-y-1.5">
      {keyword?.autocomplete && !expressionish ? (
        /*
         * `allowFreeText` stays on throughout. Firefly creates categories, tags
         * and expense accounts on the fly when a rule names one that does not
         * exist yet, so a picker that refused an unknown name would refuse a
         * working rule. It is a suggestion list, not a whitelist.
         */
        <>
          <Combobox
            endpoint={keyword.autocomplete}
            value={value}
            onChange={onChange}
            placeholder={placeholderFor(keyword)}
            label={label}
            extraQuery={keyword.accountTypes ? { types: keyword.accountTypes } : undefined}
          />
          <input type="hidden" name={name} value={value} />
        </>
      ) : (
        <Input
          name={name}
          value={value}
          inputMode={keyword?.kind === 'amount' ? 'decimal' : undefined}
          placeholder={keyword?.kind === 'amount' ? '25.00' : placeholderFor(keyword)}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
          aria-describedby={expressionish ? `${name}-expression` : undefined}
          className={cn(expressionish && 'font-mono text-xs')}
        />
      )}

      {evaluated ? (
        <ExpressionPanel id={`${name}-expression`} value={value} onChange={onChange} />
      ) : null}
    </div>
  );
}

function placeholderFor(keyword: Keyword | undefined): string {
  if (!keyword?.autocomplete) return 'value';
  if (keyword.autocomplete === 'accounts') return 'Pick or type an account';
  if (keyword.autocomplete === 'bills') return 'Pick a subscription';
  // "categories" → "category", so the hint reads as one thing rather than a set.
  const singular = keyword.autocomplete.replace(/ies$/, 'y').replace(/s$/, '');
  return `Pick or type a ${singular}`;
}

/**
 * Everything under the box: the escaped-literal warning, the live preview, the
 * problems, and the way in.
 */
function ExpressionPanel({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const mode = valueMode(value);

  if (mode === 'escaped') {
    /*
     * The one case that looks like a bug in someone else's software.
     *
     * Firefly writes a `\=` value verbatim INCLUDING the `=`, so the rule sets
     * the description to the text of its own expression — which reads exactly
     * like an expression that failed to run. Firefly's own
     * `upgrade:600-rule-actions` command adds that prefix to every action
     * beginning with `=` when an instance moves onto the expression engine, so
     * a rule written before the upgrade arrives here escaped, and nothing in
     * the rendered value tells you which of the two you are looking at.
     */
    return (
      <div id={id} className="border-transfer/40 bg-transfer/5 rounded-md border p-2 text-xs">
        <p className="flex items-start gap-1.5 font-medium">
          <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          Stored as literal text
        </p>
        <p className="text-muted-foreground mt-1">
          The leading <code className="font-mono">\=</code> tells Firefly not to evaluate this. It
          will write the text out as-is, <strong>including the equals sign</strong>. Firefly adds
          that prefix itself when an instance is upgraded onto the expression engine, so a rule that
          used to work can end up here.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => onChange(unescapeLiteral(value))}
        >
          <Undo2 className="size-3.5" aria-hidden="true" />
          Run it as an expression
        </Button>
      </div>
    );
  }

  if (mode !== 'expression') {
    return (
      // A div, not a p. The help popover renders its panel as a sibling of its
      // trigger, and a <div> inside a <p> is invalid HTML that the browser
      // closes the paragraph around — server and client then disagree and every
      // rule page logs a hydration error.
      <div id={id} className="text-muted-foreground flex flex-wrap items-center gap-x-1.5 text-xs">
        <span>
          Start with <code className="font-mono">=</code> to build the value from the transaction.
        </span>
        <ExpressionHelp onInsert={(snippet) => onChange(snippet)} />
      </div>
    );
  }

  const problems = checkExpression(value);
  const preview = previewExpression(value);

  return (
    <div id={id} className="space-y-1.5 text-xs">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-muted-foreground inline-flex items-center gap-1 font-medium">
          <Braces className="size-3.5" aria-hidden="true" />
          Expression
        </span>
        <ExpressionHelp onInsert={(snippet) => onChange(value + snippet)} />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 px-1.5 text-xs"
          onClick={() => onChange(escapeLiteral(value))}
          title="Store this as plain text instead, equals sign and all"
        >
          Treat as text
        </Button>
      </div>

      {problems.length > 0 ? (
        <ul className="text-expense space-y-1">
          {problems.map((problem) => (
            <li key={problem.message} className="flex items-start gap-1.5">
              <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
              <span>
                {problem.message}
                {problem.suggestion ? (
                  <>
                    {' '}
                    Did you mean <code className="font-mono">{problem.suggestion}</code>?
                  </>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        /*
         * Announced politely rather than silently updated: the preview is the
         * only feedback that says what this rule will DO, and it is worth
         * hearing. `aria-live` on the wrapper, not the value, so the label
         * "Preview" goes with it.
         */
        <p aria-live="polite" className="min-w-0">
          {preview.ok ? (
            <>
              <span className="text-muted-foreground">Preview: </span>
              <span className="bg-muted rounded px-1.5 py-0.5 font-mono break-words">
                {preview.value === '' ? '(empty)' : preview.value}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">
              {/*
                Deliberately not approximated. Firefly lints the expression on
                save and answers with a precise message, so an unpreviewable
                expression is not necessarily a broken one — and a preview that
                guessed would be confidently wrong about what a rule does to
                someone's ledger.
              */}
              No preview — {preview.reason.replace(/^Cannot preview this — /, '')} Firefly will
              check it when you save.
            </span>
          )}
        </p>
      )}

      <p className="text-muted-foreground">Against a sample transaction, not a real one.</p>
    </div>
  );
}

/** The field and function catalogue, one click from the box it belongs to. */
function ExpressionHelp({ onInsert }: { onInsert: (snippet: string) => void }) {
  const groups = React.useMemo(() => {
    const byGroup = new Map<string, typeof EXPRESSION_FIELDS>();
    for (const field of EXPRESSION_FIELDS) {
      const bucket = byGroup.get(field.group);
      if (bucket) bucket.push(field);
      else byGroup.set(field.group, [field]);
    }
    return [...byGroup.entries()];
  }, []);

  return (
    <Popover
      trigger={(props) => (
        <Button type="button" variant="ghost" size="sm" className="h-6 px-1.5 text-xs" {...props}>
          <Lightbulb className="size-3.5" aria-hidden="true" />
          Fields &amp; functions
        </Button>
      )}
      label="Fields and functions you can use in an expression"
      align="start"
      contentClassName="w-[22rem] max-w-[calc(100vw-2rem)]"
    >
      <div className="max-h-80 space-y-3 overflow-y-auto pr-1 text-xs">
        <p className="text-muted-foreground">
          A value starting with <code className="font-mono">=</code> is evaluated against the
          transaction. Join pieces with <code className="font-mono">~</code>, for example{' '}
          <code className="font-mono">=&apos;Bill for &apos; ~ substr(date, 0, 7)</code>.
        </p>

        <div>
          <p className="mb-1 font-medium">Functions</p>
          <p className="text-muted-foreground mb-1.5">
            These five and no others — Firefly registers nothing else, so anything more is rejected
            when you save.
          </p>
          <ul className="space-y-1">
            {EXPRESSION_FUNCTIONS.map((fn) => (
              <li key={fn.name}>
                <button
                  type="button"
                  onClick={() =>
                    onInsert(fn.name === 'substr' ? 'substr(date, 0, 7)' : fn.signature)
                  }
                  className="hover:bg-muted w-full rounded px-1.5 py-1 text-left"
                >
                  <code className="font-mono">{fn.signature}</code>
                  <span className="text-muted-foreground block">{fn.description}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {groups.map(([group, fields]) => (
          <div key={group}>
            <p className="mb-1 font-medium">{group}</p>
            <ul className="space-y-0.5">
              {fields.map((field) => (
                <li key={field.name}>
                  <button
                    type="button"
                    onClick={() => onInsert(field.name)}
                    className="hover:bg-muted w-full rounded px-1.5 py-1 text-left"
                  >
                    <code className="font-mono">{field.name}</code>
                    {field.sample ? (
                      <span className="text-muted-foreground"> — {field.sample}</span>
                    ) : null}
                    {field.note ? (
                      <span className="text-muted-foreground block">{field.note}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Popover>
  );
}
