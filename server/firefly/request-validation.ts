import { z } from 'zod';
import { REQUEST_BODIES, REQUEST_SCHEMAS } from '@/spec/generated/request-schemas';

/**
 * E1-14 — check a request body against the vendored spec before the proxy
 * forwards it.
 *
 * Without this, a malformed body reached Firefly and came back as whatever
 * Firefly made of it: often a 422 naming the wrong field, sometimes a 500 (the
 * reconciliation shapes in docs/LEARNING.md §7 are two of those). Refusing it
 * here costs no round trip and names the actual problem.
 *
 * How lenient the schemas are, and why responses are not validated at all, is
 * in `scripts/spec-zod.ts`.
 */

export interface BodyIssue {
  path: string;
  message: string;
}

export type BodyCheck = { ok: true } | { ok: false; issues: BodyIssue[] };

const MAX_ISSUES = 10;

export function validateRequestBody(method: string, path: string, body: unknown): BodyCheck {
  const verb = method.toLowerCase();
  const rule = REQUEST_BODIES.find(
    (entry) => entry.method === verb && new RegExp(entry.pattern).test(path),
  );
  // No JSON body in the spec for this operation: nothing to hold it to.
  if (!rule) return { ok: true };

  if (body === undefined) {
    return rule.required
      ? { ok: false, issues: [{ path: '', message: 'A JSON request body is required.' }] }
      : { ok: true };
  }

  const base = REQUEST_SCHEMAS[rule.schema];
  if (!base) return { ok: true };
  // An update is a PATCH in all but name. The spec marks `name` required on
  // BillUpdate, but `PUT /bills/{id}` with only `object_group_title` answers
  // 200 on 6.5.5 — Firefly's update rules are `sometimes`. So a PUT enforces
  // the types of what it sends, not the presence of what it leaves out. Nested
  // objects keep their required keys: a split or a rule trigger that IS sent
  // still has to be whole.
  const schema = rule.method === 'put' && base instanceof z.ZodObject ? base.partial() : base;

  const result = schema.safeParse(body);
  if (result.success) return { ok: true };

  return {
    ok: false,
    issues: result.error.issues.slice(0, MAX_ISSUES).map((issue) => ({
      path: issue.path.map(String).join('.'),
      message: issue.message,
    })),
  };
}
