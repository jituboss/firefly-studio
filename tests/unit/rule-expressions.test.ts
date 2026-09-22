import { describe, expect, it } from 'vitest';
import {
  checkExpression,
  escapeLiteral,
  EXPRESSION_FIELDS,
  EXPRESSION_FUNCTIONS,
  expressionBody,
  isEscapedLiteral,
  isExpression,
  previewExpression,
  unescapeLiteral,
  valueMode,
} from '@/lib/rule-expressions';

describe('isExpression', () => {
  it.each([
    ["='X'", true],
    ['=date', true],
    // Firefly requires strlen > 1, so a bare "=" is text.
    ['=', false],
    ['', false],
    ['Groceries', false],
    [' =date', false],
    ['\\=date', false],
  ])('%s → %s', (value, expected) => {
    expect(isExpression(value)).toBe(expected);
  });
});

describe('the escape', () => {
  const ESCAPED = "\\='DESCO Bill Payment for ' ~ substr(date, 0, 7)";
  const EXPR = "='DESCO Bill Payment for ' ~ substr(date, 0, 7)";

  it('recognises an escaped literal', () => {
    expect(isEscapedLiteral(ESCAPED)).toBe(true);
    expect(valueMode(ESCAPED)).toBe('escaped');
  });

  it('does not treat an escaped literal as an expression', () => {
    // The bug this whole affordance exists for: Firefly writes the rest of the
    // value verbatim, `=` included, so it looks like an expression that ran and
    // produced its own source.
    expect(isExpression(ESCAPED)).toBe(false);
  });

  it('round-trips', () => {
    expect(unescapeLiteral(ESCAPED)).toBe(EXPR);
    expect(escapeLiteral(EXPR)).toBe(ESCAPED);
    expect(unescapeLiteral(escapeLiteral(EXPR))).toBe(EXPR);
  });

  it('does not double-escape', () => {
    expect(escapeLiteral(ESCAPED)).toBe(ESCAPED);
  });

  it('leaves plain text alone', () => {
    expect(unescapeLiteral('Groceries')).toBe('Groceries');
    expect(valueMode('Groceries')).toBe('text');
  });
});

describe('expressionBody', () => {
  it('drops the leading marker', () => {
    expect(expressionBody("='a' ~ 'b'")).toBe("'a' ~ 'b'");
  });

  it('is empty for anything that is not an expression', () => {
    expect(expressionBody('plain')).toBe('');
  });
});

describe('checkExpression', () => {
  it('passes a valid expression', () => {
    expect(checkExpression("='Bill for ' ~ substr(date, 0, 7)")).toEqual([]);
  });

  it('says nothing about plain text', () => {
    expect(checkExpression('=')).toEqual([]);
    expect(checkExpression('Groceries')).toEqual([]);
  });

  it('catches an unknown field and suggests the right one', () => {
    const [problem] = checkExpression('=catagory_name');
    expect(problem?.message).toMatch(/not a field/);
    expect(problem?.suggestion).toBe('category_name');
  });

  it('catches an unknown function and lists the real ones', () => {
    const [problem] = checkExpression('=strtolower(description)');
    expect(problem?.message).toMatch(/no function called "strtolower"/);
    expect(problem?.message).toMatch(/substr/);
  });

  it('offers no suggestion when nothing is close', () => {
    const [problem] = checkExpression('=qqqqqqqqqqqq');
    expect(problem?.suggestion).toBeUndefined();
  });

  it('catches an unclosed quote', () => {
    expect(checkExpression("='unclosed ~ date")[0]?.message).toMatch(/quote/);
  });

  it('catches an unclosed bracket', () => {
    expect(checkExpression('=substr(date, 0, 7')[0]?.message).toMatch(/bracket/);
  });

  it('catches a stray closing bracket', () => {
    expect(checkExpression('=date)')[0]?.message).toMatch(/nothing to close/);
  });

  it('does not mistake a name inside a string for a field', () => {
    expect(checkExpression("='catagory_name is not a field'")).toEqual([]);
  });

  it('warns hard about tags, which take the whole transaction down', () => {
    const problems = checkExpression("='x' ~ tags");
    expect(problems.some((problem) => /Array to string/.test(problem.message))).toBe(true);
  });

  it('accepts the keywords that are not fields', () => {
    expect(checkExpression('=true')).toEqual([]);
  });

  it("accepts Firefly's own neutered constant()", () => {
    expect(checkExpression("=constant('x')")).toEqual([]);
  });
});

/**
 * Every expected value below was taken from Firefly itself, not reasoned out.
 *
 * A rule was created on a live 6.5.5 instance, each expression written into its
 * action in turn, a matching transaction created, and the description it
 * produced read back. A preview that disagrees with that is worse than no
 * preview, so the two least obvious cases are pinned hardest: `substr(date, 0,
 * -9)` really is "2026-08-14", and `'' ~ 1 + 2` really is "3" — `~` binds
 * looser than `+`, which is the opposite of what reading it left to right
 * suggests.
 */
describe('previewExpression', () => {
  const preview = (value: string) => previewExpression(value);

  it('renders the example from the Firefly docs', () => {
    expect(preview("='DESCO Bill Payment for ' ~ substr(date, 0, 7)")).toEqual({
      ok: true,
      value: 'DESCO Bill Payment for 2026-08',
    });
  });

  it('concatenates fields', () => {
    expect(preview('=source_account_name ~ " → " ~ destination_account_name')).toEqual({
      ok: true,
      value: 'Everyday Current → Stadtwerke',
    });
  });

  it('shows the amount exactly as Firefly would — signed and long', () => {
    // The single most surprising value in the whole list; the preview earns its
    // place by showing it before someone writes it into every description.
    expect(preview('=amount')).toEqual({ ok: true, value: '-12.500000000000' });
  });

  it('handles substr with only a start', () => {
    expect(preview('=substr(currency_code, 1)')).toEqual({ ok: true, value: 'UR' });
  });

  it('handles a negative substr start, as PHP does', () => {
    expect(preview('=substr(date, -8)')).toEqual({ ok: true, value: '00:00:00' });
  });

  it('handles a negative substr length, as PHP does', () => {
    expect(preview('=substr(date, 0, -9)')).toEqual({ ok: true, value: '2026-08-14' });
  });

  it('counts characters', () => {
    expect(preview('=strlen(currency_code)')).toEqual({ ok: true, value: '3' });
  });

  it('returns nothing from strpos when there is no match, as PHP does', () => {
    expect(preview("='[' ~ strpos(description, 'zzz') ~ ']'")).toEqual({ ok: true, value: '[]' });
  });

  it('finds a position when there is one', () => {
    expect(preview("=strpos(description, 'electricity')")).toEqual({ ok: true, value: '8' });
  });

  it('does arithmetic', () => {
    expect(preview('=min(3, 9) ~ "/" ~ max(3, 9)')).toEqual({ ok: true, value: '3/9' });
    expect(preview('=2 + 3 * 4')).toEqual({ ok: true, value: '14' });
    expect(preview('=(2 + 3) * 4')).toEqual({ ok: true, value: '20' });
  });

  it('subtracts without mistaking the minus for a number sign', () => {
    expect(preview('=10 - 3')).toEqual({ ok: true, value: '7' });
  });

  it('binds ~ looser than +, as Symfony does', () => {
    // If ~ bound tighter this would be "12" then "3" appended.
    expect(preview("='' ~ 1 + 2")).toEqual({ ok: true, value: '3' });
  });

  it('understands escaped quotes inside a string', () => {
    expect(preview("='it\\'s'")).toEqual({ ok: true, value: "it's" });
  });

  it('refuses rather than guessing at syntax it does not support', () => {
    const result = preview('=description matches "/x/"');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/not supported/);
  });

  it('refuses a ternary rather than picking a branch', () => {
    expect(preview('=strlen(description) > 3 ? "long" : "short"').ok).toBe(false);
  });

  it('refuses when the expression has a problem', () => {
    const result = preview('=nonexistent_field');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/Fix the problems/);
  });

  it('refuses a division by zero instead of rendering Infinity', () => {
    expect(preview('=1 / 0').ok).toBe(false);
  });

  it('is not an expression at all when there is no leading marker', () => {
    expect(preview('Groceries').ok).toBe(false);
  });

  it('never throws, whatever it is handed', () => {
    for (const junk of ['=(((', '=)', "='", '=~', '=,', '=substr(', '=1..2', '=🙂']) {
      expect(() => preview(junk)).not.toThrow();
    }
  });
});

describe('the catalogues', () => {
  it('lists exactly the five functions Firefly registers', () => {
    expect(EXPRESSION_FUNCTIONS.map((fn) => fn.name).sort()).toEqual([
      'max',
      'min',
      'strlen',
      'strpos',
      'substr',
    ]);
  });

  it('has no duplicate field names', () => {
    const names = EXPRESSION_FIELDS.map((field) => field.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('carries a note on every field whose value defies its name', () => {
    for (const name of ['amount', 'date', 'transaction_type_type', 'tags']) {
      expect(EXPRESSION_FIELDS.find((field) => field.name === name)?.note).toBeTruthy();
    }
  });
});
