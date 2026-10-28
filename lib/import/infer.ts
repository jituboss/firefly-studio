import { isOwn, type AccountKind } from '@/lib/account-matrix';
import type { ImportRow } from './cells';

/**
 * What kind of account a name the ledger has never seen probably is.
 *
 * A spreadsheet says "Salary · Acme Ltd → Everyday Current" and "Rent · Everyday
 * Current → Landlord", never "Acme Ltd is a revenue account". The kind decides
 * the transaction type (`lib/account-matrix.ts`), so a wrong guess books an
 * income as a transfer. This reads the evidence a person would:
 *
 *  1. **How money moves through the name across the WHOLE file.** A payee only
 *     ever receives and a payer only ever sends; a name that does both — paid
 *     into in one row, paid out of in another — is one of your own accounts.
 *     The strongest signal there is, and one no single row can show.
 *  2. **The hub.** A bank export is one account against everyone else, so a new
 *     name that sits on one side of most rows, against many different
 *     counterparties, is the account the file is about.
 *  3. **The name itself.** "Savings", "Visa ••1234", an IBAN, "Car loan",
 *     "Mortgage": words that only ever name an account you hold.
 *  4. **What the row says it is.** A description or category of "Salary" or
 *     "Refund" means money came IN from outside; "Transfer to savings" means
 *     both sides are yours; "Loan repayment" points at a liability.
 *
 * Every guess carries its reason, shown in the preview beside a control to
 * change it, so the inference is a starting point the user can read and
 * overrule — never a silent decision. An account named by an existing
 * account, a kind column or a preview choice never reaches this module.
 */

export interface KindGuess {
  kind: AccountKind;
  /**
   * The kind when the name is the SOURCE, where it differs. A shop that also
   * refunds you is a payee and a payer at once, and Firefly records that as
   * two accounts of the same name — an expense one and a revenue one.
   */
  asSource?: AccountKind;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

const LIABILITY_WORDS: Array<[RegExp, AccountKind]> = [
  [/\bmortgage\b/i, 'mortgage'],
  [
    /\b(loan|financing|finance plan|emi|instal+ment plan|student loan|car loan|auto loan)\b/i,
    'loan',
  ],
  [/\b(debt|iou|owed?|borrowed|credit line|line of credit|overdraft)\b/i, 'debt'],
];

const ACCOUNT_WORDS =
  /\b(bank|account|acct|a\/c|savings?|checking|chequing|current|wallet|purse|pocket|pot|vault|card|visa|mastercard|amex|debit|credit card|brokerage|investment|isa|401k|ira|pension fund|deposit account|fixed deposit|fdr|dps|paypal|revolut|wise|n26|monzo|bkash|nagad|rocket|upay|venmo|cash app|petty cash)\b/i;
const IBAN = /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){2,7}\b/;
const MASKED_NUMBER = /(?:[*x•·]{2,}\s?\d{2,4}\b|\bending(?: in)? \d{3,4}\b|\b\d{4}\s?[*x•]{4})/i;

const INCOME_WORDS =
  /\b(salary|pay ?check|pay ?slip|payroll|wages?|bonus|commission|dividends?|interest (?:earned|received|credit)|refund(?:ed)?|cash ?back|reimburse(?:ment|d)?|rebate|invoice paid|freelance|income|stipend|allowance|gift received|rent received|grant)\b/i;
const TRANSFER_WORDS =
  /\b(transfer(?:red)?|move[ds]? (?:to|from)|top[- ]?up|topup|to savings|from savings|own account|between accounts|sweep)\b/i;
const REPAYMENT_WORDS = /\b(repayment|repay|emi|instal+ment|loan payment|mortgage payment)\b/i;
const PAYER_NAMES =
  /\b(ltd|limited|inc|corp|corporation|llc|gmbh|plc|employer|payroll|tax (?:office|refund)|irs|hmrc|government|client|customer)\b/i;

function liabilityFromName(name: string): AccountKind | null {
  for (const [pattern, kind] of LIABILITY_WORDS) if (pattern.test(name)) return kind;
  return null;
}

function looksLikeAccount(name: string): string | null {
  if (IBAN.test(name)) return 'it looks like an IBAN';
  if (MASKED_NUMBER.test(name)) return 'it carries a masked card or account number';
  const word = ACCOUNT_WORDS.exec(name)?.[0];
  return word ? `its name says “${word}”` : null;
}

interface Evidence {
  name: string;
  sent: number;
  received: number;
  /** Rows where it pays out and the row reads as income — refunds, cashback. */
  sentIncome: number;
  counterparties: Set<string>;
  incomeRows: number;
  transferRows: number;
  repaymentRows: number;
}

export function normaliseForInference(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Guess a kind for every name in `rows` that `isKnown` does not recognise.
 * `knownKind` reports the kind of a name that DOES exist, so a new name
 * opposite one of your accounts is read in that light.
 */
export function inferKinds(
  rows: ImportRow[],
  isKnown: (name: string) => boolean,
  knownKind: (name: string) => AccountKind | null,
): Map<string, KindGuess> {
  const evidence = new Map<string, Evidence>();
  const usable = rows.filter((row) => row.source && row.destination);

  const touch = (name: string) => {
    const key = normaliseForInference(name);
    let entry = evidence.get(key);
    if (!entry) {
      entry = {
        name,
        sent: 0,
        received: 0,
        sentIncome: 0,
        counterparties: new Set(),
        incomeRows: 0,
        transferRows: 0,
        repaymentRows: 0,
      };
      evidence.set(key, entry);
    }
    return entry;
  };

  for (const row of usable) {
    const context = `${row.description} ${row.category} ${row.notes}`;
    const income = INCOME_WORDS.test(context);
    const transfer = TRANSFER_WORDS.test(context);
    const repayment = REPAYMENT_WORDS.test(context);

    const source = touch(row.source);
    const destination = touch(row.destination);
    source.sent += 1;
    if (income) source.sentIncome += 1;
    destination.received += 1;
    source.counterparties.add(normaliseForInference(row.destination));
    destination.counterparties.add(normaliseForInference(row.source));
    for (const entry of [source, destination]) {
      if (income) entry.incomeRows += 1;
      if (transfer) entry.transferRows += 1;
      if (repayment) entry.repaymentRows += 1;
    }
  }

  // The hub: the busiest name, if it is in most rows against several parties.
  let hub: string | null = null;
  let hubRows = 0;
  for (const [key, entry] of evidence) {
    const total = entry.sent + entry.received;
    if (total > hubRows) {
      hub = key;
      hubRows = total;
    }
  }
  const hubEntry = hub ? evidence.get(hub) : undefined;
  const isHub =
    hubEntry !== undefined &&
    usable.length >= 3 &&
    hubRows >= Math.ceil(usable.length * 0.6) &&
    hubEntry.counterparties.size >= 3;

  const guesses = new Map<string, KindGuess>();

  for (const [key, entry] of evidence) {
    if (isKnown(entry.name)) continue;

    const liability = liabilityFromName(entry.name);
    const accountish = looksLikeAccount(entry.name);
    const both = entry.sent > 0 && entry.received > 0;
    const ownKind: AccountKind = liability ?? 'asset';
    const ownLabel = liability ? `your ${liability}` : 'one of your accounts';

    if (both && !accountish && !liability && entry.sent === entry.sentIncome) {
      guesses.set(key, {
        kind: 'expense',
        asSource: 'revenue',
        confidence: 'medium',
        reason: `Treated as a payee that also pays you back: every payment from it reads as a refund or income, so it is recorded as a payee and a payer of the same name, as Firefly does.`,
      });
      continue;
    }
    if (both) {
      guesses.set(key, {
        kind: ownKind,
        confidence: 'high',
        reason: `Treated as ${ownLabel}: money goes both into and out of it in this file (${entry.received} in, ${entry.sent} out).`,
      });
      continue;
    }
    if (isHub && key === hub) {
      guesses.set(key, {
        kind: ownKind,
        confidence: 'high',
        reason: `Treated as ${ownLabel}: it is on one side of ${hubRows} of the ${usable.length} rows, against ${entry.counterparties.size} different counterparties — the account this file is about.`,
      });
      continue;
    }
    if (liability) {
      guesses.set(key, {
        kind: liability,
        confidence: 'high',
        reason: `Treated as your ${liability}: the name says so.`,
      });
      continue;
    }

    // Opposite an account you already hold, a plain new name is the outside
    // world — unless it names an account, or the rows call it a transfer.
    const opposite = [...entry.counterparties].map((name) => knownKind(name));
    const facesOwn = opposite.some((kind) => isOwn(kind));

    if (accountish && (entry.transferRows > 0 || !PAYER_NAMES.test(entry.name))) {
      guesses.set(key, {
        kind: 'asset',
        confidence: entry.transferRows > 0 ? 'high' : 'medium',
        reason: `Treated as one of your accounts: ${accountish}${entry.transferRows > 0 ? ', and its rows describe a transfer' : ''}.`,
      });
      continue;
    }
    if (entry.transferRows > 0 && entry.transferRows === entry.sent + entry.received && facesOwn) {
      guesses.set(key, {
        kind: 'asset',
        confidence: 'medium',
        reason: 'Treated as one of your accounts: every row it appears in describes a transfer.',
      });
      continue;
    }
    if (entry.repaymentRows > 0 && entry.received > 0 && facesOwn) {
      guesses.set(key, {
        kind: 'loan',
        confidence: 'medium',
        reason: 'Treated as a loan you are paying off: its rows describe repayments.',
      });
      continue;
    }

    if (entry.sent > 0) {
      guesses.set(key, {
        kind: 'revenue',
        confidence: entry.incomeRows > 0 || PAYER_NAMES.test(entry.name) ? 'high' : 'medium',
        reason:
          entry.incomeRows > 0
            ? 'Treated as a payer: it only ever pays money in, and its rows read as income.'
            : 'Treated as a payer: it only ever pays money in.',
      });
    } else {
      guesses.set(key, {
        kind: 'expense',
        confidence: 'medium',
        reason: 'Treated as a payee: it only ever receives money.',
      });
    }
  }

  return guesses;
}
