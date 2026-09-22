/**
 * E11-09 — Firefly's rule-action expression engine, made visible.
 *
 * A rule action value whose first character is `=` is not text. Firefly hands
 * the rest to Symfony's ExpressionLanguage with the transaction's own fields in
 * scope, so `='Bill for ' ~ substr(date, 0, 7)` writes "Bill for 2026-08". The
 * feature is real, it is on by default (`firefly.feature_flags.expression_engine`
 * is hard-coded true in 6.5.5), and it is documented nowhere in the OpenAPI
 * spec — which means a plain text box in front of it is a feature nobody finds
 * and a footgun for anyone whose value happens to begin with `=`.
 *
 * Everything in this file was established against a live 6.5.5 instance by
 * writing rules and reading back what they produced. Sources inside the
 * container: `TransactionRules/Expressions/ActionExpression.php` (the `=`
 * trigger and the variable whitelist), `TransactionRules/Engine/
 * CustomExpressionLanguage.php` (the five functions), `Models/RuleAction.php`
 * (the `\=` escape) and `Rules/IsValidActionExpression.php` (save-time linting).
 *
 * ## The escape, which is the trap
 *
 * A value starting with `\=` is a LITERAL, and Firefly writes the rest of it
 * verbatim — **including the `=`**. So an action stored as
 * `\='Bill for ' ~ substr(date, 0, 7)` sets the description to the string
 * `='Bill for ' ~ substr(date, 0, 7)`, which looks exactly like an expression
 * that silently failed to run. Firefly's own `upgrade:600-rule-actions` command
 * adds that prefix to every action value beginning with `=` when an instance is
 * upgraded to the expression engine, so a rule written before the upgrade comes
 * out the other side escaped. `valueMode` detects this and the builder offers to
 * undo it, because there is no way to tell from the rendered value alone.
 */

export type ValueMode = 'text' | 'expression' | 'escaped';

/** Firefly: `str_starts_with($expr, '=') && strlen($expr) > 1`. */
export function isExpression(value: string): boolean {
  return value.startsWith('=') && value.length > 1;
}

/** Firefly: `str_starts_with($this->action_value, '\=')`. */
export function isEscapedLiteral(value: string): boolean {
  return value.startsWith('\\=');
}

export function valueMode(value: string): ValueMode {
  if (isEscapedLiteral(value)) return 'escaped';
  if (isExpression(value)) return 'expression';
  return 'text';
}

/** `='X'` → `\='X'`. Stops Firefly evaluating a value that only looks like one. */
export function escapeLiteral(value: string): string {
  return isEscapedLiteral(value) ? value : `\\${value}`;
}

/** `\='X'` → `='X'`. Turns a rule the upgrade command escaped back into one. */
export function unescapeLiteral(value: string): string {
  return isEscapedLiteral(value) ? value.slice(1) : value;
}

/** The expression body, without its leading `=`. */
export function expressionBody(value: string): string {
  return isExpression(value) ? value.slice(1) : '';
}

export interface ExpressionField {
  name: string;
  label: string;
  group: string;
  /**
   * What this field actually held on a real withdrawal, read back out of a
   * live 6.5.5 instance rather than guessed from the field name. The preview
   * uses these, so it can only mislead in the ways Firefly itself does.
   */
  sample: string;
  /** Shown in the picker when the value is not what the name suggests. */
  note?: string;
}

/**
 * The variables in scope, from `ActionExpression::$NAMES`.
 *
 * Three of the samples are the reason this list carries samples at all:
 * `amount` is signed and carried to twelve places, `date` is a datetime and not
 * a date, and `transaction_type_type` is capitalised. Each of those has an
 * obvious wrong assumption attached to it, and each was checked.
 */
export const EXPRESSION_FIELDS: ExpressionField[] = [
  {
    name: 'description',
    label: 'Description',
    group: 'Transaction',
    sample: 'Monthly electricity bill',
  },
  {
    name: 'date',
    label: 'Date',
    group: 'Transaction',
    sample: '2026-08-14 00:00:00',
    note: 'A datetime, not a date — substr(date, 0, 10) for the day, 0, 7 for the month.',
  },
  {
    name: 'amount',
    label: 'Amount',
    group: 'Transaction',
    sample: '-12.500000000000',
    note: 'Signed, and carried to twelve decimal places. Not the figure you see in the list.',
  },
  {
    name: 'transaction_type_type',
    label: 'Transaction type',
    group: 'Transaction',
    sample: 'Withdrawal',
    note: 'Capitalised: Withdrawal, Deposit, Transfer.',
  },
  { name: 'notes', label: 'Notes', group: 'Transaction', sample: 'Paid by card' },
  {
    name: 'tags',
    label: 'Tags',
    group: 'Transaction',
    sample: '',
    note: 'An ARRAY. Using it in an expression fails the whole transaction with a 500 — see the warning below.',
  },
  {
    name: 'transaction_group_title',
    label: 'Group title',
    group: 'Transaction',
    sample: '',
  },

  { name: 'category_name', label: 'Category', group: 'Classification', sample: 'Utilities' },
  { name: 'category_id', label: 'Category id', group: 'Classification', sample: '57' },
  { name: 'budget_name', label: 'Budget', group: 'Classification', sample: 'Everyday spending' },
  { name: 'budget_id', label: 'Budget id', group: 'Classification', sample: '23' },

  {
    name: 'source_account_name',
    label: 'Source account',
    group: 'Accounts',
    sample: 'Everyday Current',
  },
  { name: 'source_account_id', label: 'Source account id', group: 'Accounts', sample: '104' },
  { name: 'source_account_iban', label: 'Source IBAN', group: 'Accounts', sample: '' },
  {
    name: 'source_account_type',
    label: 'Source account type',
    group: 'Accounts',
    sample: 'Asset account',
  },
  {
    name: 'destination_account_name',
    label: 'Destination account',
    group: 'Accounts',
    sample: 'Stadtwerke',
  },
  {
    name: 'destination_account_id',
    label: 'Destination account id',
    group: 'Accounts',
    sample: '130',
  },
  { name: 'destination_account_iban', label: 'Destination IBAN', group: 'Accounts', sample: '' },
  {
    name: 'destination_account_type',
    label: 'Destination account type',
    group: 'Accounts',
    sample: 'Expense account',
  },

  { name: 'currency_code', label: 'Currency code', group: 'Currency', sample: 'EUR' },
  { name: 'currency_name', label: 'Currency name', group: 'Currency', sample: 'Euro' },
  { name: 'currency_symbol', label: 'Currency symbol', group: 'Currency', sample: '€' },
  {
    name: 'currency_decimal_places',
    label: 'Currency decimals',
    group: 'Currency',
    sample: '2',
  },
  { name: 'foreign_amount', label: 'Foreign amount', group: 'Currency', sample: '' },
  { name: 'foreign_currency_code', label: 'Foreign currency code', group: 'Currency', sample: '' },
  { name: 'foreign_currency_name', label: 'Foreign currency name', group: 'Currency', sample: '' },
  {
    name: 'foreign_currency_symbol',
    label: 'Foreign currency symbol',
    group: 'Currency',
    sample: '',
  },
  {
    name: 'foreign_currency_decimal_places',
    label: 'Foreign currency decimals',
    group: 'Currency',
    sample: '',
  },

  { name: 'created_at', label: 'Created at', group: 'Dates', sample: '2026-09-22 04:42:46' },
  { name: 'updated_at', label: 'Updated at', group: 'Dates', sample: '2026-09-22 04:42:46' },
  {
    name: 'group_created_at',
    label: 'Group created at',
    group: 'Dates',
    sample: '2026-09-22 04:42:47',
  },
  {
    name: 'group_updated_at',
    label: 'Group updated at',
    group: 'Dates',
    sample: '2026-09-22 04:42:47',
  },
  { name: 'interest_date', label: 'Interest date', group: 'Dates', sample: '' },
  { name: 'payment_date', label: 'Payment date', group: 'Dates', sample: '' },
  { name: 'invoice_date', label: 'Invoice date', group: 'Dates', sample: '' },
  { name: 'book_date', label: 'Book date', group: 'Dates', sample: '' },
  { name: 'due_date', label: 'Due date', group: 'Dates', sample: '' },
  { name: 'process_date', label: 'Process date', group: 'Dates', sample: '' },
];

/** `tags` is in scope and using it is a 500. Named so the UI can warn specifically. */
export const UNUSABLE_FIELDS = new Set(['tags']);

export interface ExpressionFunction {
  name: string;
  signature: string;
  description: string;
}

/**
 * The whole function library.
 *
 * `CustomExpressionLanguage::registerFunctions()` overrides Symfony's and
 * registers exactly these five PHP functions. It does not call the parent, so
 * nothing else exists — `strtolower`, `str_replace`, `date` and every other
 * thing worth reaching for are all absent, and asking for one is a 422 at save
 * time. Listing them is more useful than letting people find out one at a time.
 */
export const EXPRESSION_FUNCTIONS: ExpressionFunction[] = [
  {
    name: 'substr',
    signature: 'substr(text, start, length)',
    description: 'Part of a string. substr(date, 0, 7) is the year and month.',
  },
  { name: 'strlen', signature: 'strlen(text)', description: 'How many characters.' },
  {
    name: 'strpos',
    signature: 'strpos(haystack, needle)',
    description: 'Where one string appears inside another, or nothing if it does not.',
  },
  { name: 'min', signature: 'min(a, b)', description: 'The smaller of two numbers.' },
  { name: 'max', signature: 'max(a, b)', description: 'The larger of two numbers.' },
];

const FIELD_NAMES = new Set(EXPRESSION_FIELDS.map((field) => field.name));
const FUNCTION_NAMES = new Set(EXPRESSION_FUNCTIONS.map((fn) => fn.name));
// Firefly's provider replaces the dangerous built-in with a no-op, but the name
// still resolves, so flagging it as unknown would be wrong.
const EXTRA_FUNCTIONS = new Set(['constant', 'constant2']);

export interface ExpressionProblem {
  message: string;
  /** A name the author probably meant, when one is close enough to suggest. */
  suggestion?: string;
}

/**
 * Check an expression without running it.
 *
 * Firefly lints on save and returns a precise 422, so this is not the only
 * safety net — it is the one that arrives before the round trip and before the
 * rest of a half-filled form is at risk. It deliberately reports only what it
 * is sure of: an unbalanced quote or bracket, a name that is not in the
 * whitelist, a function that does not exist. Anything subtler is left to
 * Firefly, whose parser is the real authority.
 */
export function checkExpression(value: string): ExpressionProblem[] {
  if (!isExpression(value)) return [];
  const body = expressionBody(value);
  const problems: ExpressionProblem[] = [];

  const tokens = tokenise(body);
  if (tokens.unterminatedString) {
    problems.push({ message: 'A quote is opened and never closed.' });
  }
  if (tokens.depth > 0) {
    problems.push({ message: 'A bracket is opened and never closed.' });
  }
  if (tokens.depth < 0) {
    problems.push({ message: 'There is a closing bracket with nothing to close.' });
  }

  for (const name of tokens.functions) {
    if (FUNCTION_NAMES.has(name) || EXTRA_FUNCTIONS.has(name)) continue;
    problems.push({
      message: `There is no function called "${name}". Firefly offers only ${[...FUNCTION_NAMES].join(', ')}.`,
      suggestion: closest(name, [...FUNCTION_NAMES]),
    });
  }

  for (const name of tokens.identifiers) {
    if (FIELD_NAMES.has(name)) continue;
    // `true`, `false`, `null` and the operators are keywords, not fields.
    if (KEYWORDS.has(name)) continue;
    problems.push({
      message: `"${name}" is not a field Firefly puts in scope.`,
      suggestion: closest(name, [...FIELD_NAMES]),
    });
  }

  for (const name of tokens.identifiers) {
    if (!UNUSABLE_FIELDS.has(name)) continue;
    problems.push({
      message: `"${name}" is an array, and Firefly throws "Array to string conversion" when an expression touches it — the transaction is then rejected outright with a 500, not just the rule. Verified on 6.5.5.`,
    });
  }

  return problems;
}

const KEYWORDS = new Set([
  'true',
  'false',
  'null',
  'and',
  'or',
  'not',
  'in',
  'matches',
  'starts',
  'ends',
  'with',
]);

interface Tokens {
  identifiers: string[];
  functions: string[];
  depth: number;
  unterminatedString: boolean;
}

/**
 * A scanner, not a parser.
 *
 * It only needs to answer three questions — which bare names appear, which of
 * them are called as functions, and whether the quotes and brackets balance —
 * and a scanner answers all three without pretending to understand precedence.
 * Re-implementing Symfony's grammar to catch what Symfony already catches on
 * save would be a second source of truth about syntax, and the wrong one.
 */
function tokenise(body: string): Tokens {
  const identifiers: string[] = [];
  const functions: string[] = [];
  let depth = 0;
  let unterminatedString = false;

  for (let index = 0; index < body.length; index += 1) {
    const char = body[index]!;

    if (char === "'" || char === '"') {
      const quote = char;
      index += 1;
      let closed = false;
      for (; index < body.length; index += 1) {
        if (body[index] === '\\') {
          index += 1;
          continue;
        }
        if (body[index] === quote) {
          closed = true;
          break;
        }
      }
      if (!closed) {
        unterminatedString = true;
        break;
      }
      continue;
    }

    if (char === '(' || char === '[') depth += 1;
    if (char === ')' || char === ']') depth -= 1;

    if (/[A-Za-z_]/.test(char)) {
      let end = index;
      while (end < body.length && /[A-Za-z0-9_]/.test(body[end]!)) end += 1;
      const name = body.slice(index, end);
      // A name followed by `(` is a call; anything else is a variable.
      const after = body.slice(end).match(/^\s*\(/);
      if (after) functions.push(name);
      else identifiers.push(name);
      index = end - 1;
    }
  }

  return { identifiers, functions, depth, unterminatedString };
}

/** The nearest known name, when one is within a small edit distance. */
function closest(name: string, candidates: string[]): string | undefined {
  let best: string | undefined;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const candidate of candidates) {
    const score = distance(name.toLowerCase(), candidate.toLowerCase());
    if (score < bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  // A third of the name may differ before the suggestion is noise rather than
  // help; "catagory_name" earns one, "xyz" does not.
  return best !== undefined && bestScore <= Math.max(2, Math.floor(name.length / 3))
    ? best
    : undefined;
}

function distance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  let previous = Array.from({ length: cols }, (_, index) => index);

  for (let row = 1; row < rows; row += 1) {
    const current = [row, ...Array.from({ length: cols - 1 }, () => 0)];
    for (let col = 1; col < cols; col += 1) {
      const cost = a[row - 1] === b[col - 1] ? 0 : 1;
      current[col] = Math.min(current[col - 1]! + 1, previous[col]! + 1, previous[col - 1]! + cost);
    }
    previous = current;
  }
  return previous[cols - 1]!;
}

/** The sample transaction the preview is computed against. */
export const SAMPLE_JOURNAL: Record<string, string> = Object.fromEntries(
  EXPRESSION_FIELDS.map((field) => [field.name, field.sample]),
);

export type PreviewResult = { ok: true; value: string } | { ok: false; reason: string };

/**
 * What this expression would write, against a sample transaction.
 *
 * The point is that `='Bill for ' ~ substr(date, 0, 7)` is unreadable until you
 * see "Bill for 2026-08" under it, and the alternative to showing that is
 * saving a rule and creating a transaction to find out.
 *
 * It supports the part of the grammar people actually use — string and number
 * literals, field names, `~`, arithmetic, and the five functions — and it
 * REFUSES anything else rather than approximating it. A preview that is
 * confidently wrong about what a rule will do to someone's ledger is worse than
 * no preview, so every unsupported construct returns a reason instead of a
 * value, and the UI says it cannot show one.
 */
export function previewExpression(
  value: string,
  journal: Record<string, string> = SAMPLE_JOURNAL,
): PreviewResult {
  if (!isExpression(value)) return { ok: false, reason: 'Not an expression.' };
  if (checkExpression(value).length > 0) return { ok: false, reason: 'Fix the problems first.' };

  try {
    const parser = new Parser(expressionBody(value), journal);
    const result = parser.parseExpression();
    parser.expectEnd();
    return { ok: true, value: stringify(result) };
  } catch (caught) {
    return {
      ok: false,
      reason:
        caught instanceof Error ? caught.message : 'This expression cannot be previewed here.',
    };
  }
}

type Value = string | number;

function stringify(value: Value): string {
  return typeof value === 'number' ? String(value) : value;
}

function asNumber(value: Value): number {
  if (typeof value === 'number') return value;
  // PHP's own string-to-number coercion: leading numeric prefix, else 0.
  const match = /^\s*[+-]?(\d+\.?\d*|\.\d+)/.exec(value);
  return match ? globalThis.Number(match[0]) : 0;
}

/**
 * A recursive-descent parser over the supported subset.
 *
 * Precedence, loosest first: `~` (concatenation), then `+`/`-`, then `*`/`/`,
 * then unary `-`, then primaries. That is Symfony's own ordering for these
 * operators, checked against its `ExpressionLanguage` precedence table — a
 * preview that bracketed `a ~ b + c` differently from Firefly would be exactly
 * the confidently-wrong answer this is built to avoid.
 */
class Parser {
  private position = 0;

  constructor(
    private readonly source: string,
    private readonly journal: Record<string, string>,
  ) {}

  parseExpression(): Value {
    let left = this.parseAdditive();
    while (this.eat('~')) {
      const right = this.parseAdditive();
      left = stringify(left) + stringify(right);
    }
    return left;
  }

  expectEnd(): void {
    this.skipSpace();
    if (this.position < this.source.length) {
      throw new Error(
        `Cannot preview this — "${this.source.slice(this.position, this.position + 12)}" is not supported here.`,
      );
    }
  }

  private parseAdditive(): Value {
    let left = this.parseMultiplicative();
    for (;;) {
      if (this.eat('+')) left = asNumber(left) + asNumber(this.parseMultiplicative());
      else if (this.eatMinus()) left = asNumber(left) - asNumber(this.parseMultiplicative());
      else return left;
    }
  }

  private parseMultiplicative(): Value {
    let left = this.parseUnary();
    for (;;) {
      if (this.eat('*')) left = asNumber(left) * asNumber(this.parseUnary());
      else if (this.eat('/')) {
        const divisor = asNumber(this.parseUnary());
        if (divisor === 0) throw new Error('Cannot preview this — it divides by zero.');
        left = asNumber(left) / divisor;
      } else return left;
    }
  }

  private parseUnary(): Value {
    if (this.eatMinus()) return -asNumber(this.parseUnary());
    return this.parsePrimary();
  }

  private parsePrimary(): Value {
    this.skipSpace();
    const char = this.source[this.position];
    if (char === undefined) throw new Error('The expression stops in the middle.');

    if (char === '(') {
      this.position += 1;
      const inner = this.parseExpression();
      this.skipSpace();
      if (this.source[this.position] !== ')') throw new Error('A bracket is never closed.');
      this.position += 1;
      return inner;
    }

    if (char === "'" || char === '"') return this.readString(char);
    if (/[0-9.]/.test(char)) return this.readNumber();
    if (/[A-Za-z_]/.test(char)) return this.readNameOrCall();

    throw new Error(`Cannot preview this — "${char}" is not supported here.`);
  }

  private readString(quote: string): string {
    this.position += 1;
    let out = '';
    while (this.position < this.source.length) {
      const char = this.source[this.position]!;
      if (char === '\\') {
        out += this.source[this.position + 1] ?? '';
        this.position += 2;
        continue;
      }
      if (char === quote) {
        this.position += 1;
        return out;
      }
      out += char;
      this.position += 1;
    }
    throw new Error('A quote is opened and never closed.');
  }

  private readNumber(): number {
    const match = /^\d*\.?\d+/.exec(this.source.slice(this.position));
    if (!match) throw new Error('That does not look like a number.');
    this.position += match[0].length;
    return globalThis.Number(match[0]);
  }

  private readNameOrCall(): Value {
    const match = /^[A-Za-z_][A-Za-z0-9_]*/.exec(this.source.slice(this.position))!;
    const name = match[0];
    this.position += name.length;
    this.skipSpace();

    if (this.source[this.position] !== '(') {
      if (name === 'true') return 1;
      if (name === 'false') return '';
      if (name === 'null') return '';
      const field = this.journal[name];
      if (field === undefined) throw new Error(`"${name}" is not a field Firefly puts in scope.`);
      return field;
    }

    this.position += 1;
    const args: Value[] = [];
    this.skipSpace();
    if (this.source[this.position] === ')') this.position += 1;
    else {
      for (;;) {
        args.push(this.parseExpression());
        this.skipSpace();
        if (this.eat(',')) continue;
        if (this.source[this.position] === ')') {
          this.position += 1;
          break;
        }
        throw new Error('The brackets around a function call do not match.');
      }
    }
    return callFunction(name, args);
  }

  private skipSpace(): void {
    while (this.position < this.source.length && /\s/.test(this.source[this.position]!)) {
      this.position += 1;
    }
  }

  private eat(token: string): boolean {
    this.skipSpace();
    if (this.source.startsWith(token, this.position)) {
      this.position += token.length;
      return true;
    }
    return false;
  }

  /** `-` needs its own eater so it is not mistaken for part of a number. */
  private eatMinus(): boolean {
    this.skipSpace();
    if (this.source[this.position] === '-') {
      this.position += 1;
      return true;
    }
    return false;
  }
}

/** PHP semantics, because that is what runs on the other side. */
function callFunction(name: string, args: Value[]): Value {
  switch (name) {
    case 'substr': {
      const text = stringify(args[0] ?? '');
      const start = asNumber(args[1] ?? 0);
      const from = start < 0 ? Math.max(text.length + start, 0) : Math.min(start, text.length);
      if (args.length < 3) return text.slice(from);
      const length = asNumber(args[2]!);
      // PHP: a negative length stops that many characters from the end.
      return length < 0
        ? text.slice(from, Math.max(text.length + length, from))
        : text.slice(from, from + length);
    }
    case 'strlen':
      return stringify(args[0] ?? '').length;
    case 'strpos': {
      const found = stringify(args[0] ?? '').indexOf(stringify(args[1] ?? ''));
      // PHP returns false, which concatenates as an empty string.
      return found === -1 ? '' : found;
    }
    case 'min':
      return Math.min(...args.map(asNumber));
    case 'max':
      return Math.max(...args.map(asNumber));
    default:
      throw new Error(
        `Cannot preview "${name}" — Firefly offers only substr, strlen, strpos, min and max.`,
      );
  }
}
