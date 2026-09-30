/**
 * E1-14 — turn the vendored spec's request-body schemas into Zod source.
 *
 * Called by `spec-codegen.ts`; output is `spec/generated/request-schemas.ts`.
 * Only request bodies are generated. Responses are deliberately NOT validated:
 * docs/LEARNING.md §7 is a long list of places where Firefly's responses differ
 * from this spec, and a response validator would turn every one of those into
 * an outage. Requests are ours to get right, so there the spec is the contract.
 *
 * The translation is lenient where Firefly itself is lenient, and strict about
 * shape:
 *
 *  - Scalars accept the string forms Laravel accepts: an integer field takes
 *    `3` or `"3"`, a boolean takes `true`, `"true"`, `1`, `"0"`, and an
 *    `*_id` field takes a number or a string. Our own forms post strings, and
 *    Firefly takes them.
 *  - Objects are LOOSE: unknown keys pass through. The spec trails Firefly
 *    (the rule vocabulary test exists because of that), and refusing a field
 *    Firefly accepts would break a write for nothing.
 *  - `readOnly` properties are dropped from request schemas.
 *  - What IS enforced: required keys, value types, enum membership, array
 *    shapes, and nesting — the mistakes that make Firefly answer a vague 422
 *    or, worse, a 500.
 */

export interface SpecSchema {
  $ref?: string;
  type?: string;
  format?: string;
  enum?: unknown[];
  nullable?: boolean;
  readOnly?: boolean;
  properties?: Record<string, SpecSchema>;
  required?: string[];
  items?: SpecSchema;
  additionalProperties?: boolean | SpecSchema;
  oneOf?: SpecSchema[];
  anyOf?: SpecSchema[];
  allOf?: SpecSchema[];
  minItems?: number;
  maxItems?: number;
}

export const ZOD_PRELUDE = `import { z } from 'zod';

/** Laravel takes numbers as numbers or numeric strings. */
const num = z.union([z.number(), z.string().regex(/^-?\\d+(\\.\\d+)?$/, 'Expected a number')]);
/** …and booleans in any of the forms its \`boolean\` rule allows. */
const bool = z.union([z.boolean(), z.literal(0), z.literal(1), z.enum(['true', 'false', '0', '1'])]);
/** Ids are strings in the spec and numeric in Firefly's validators; both reach it. */
const id = z.union([z.string(), z.number().int()]);
/** Amounts are strings on the wire; a number is accepted and coerced by Firefly. */
const amount = z.union([z.string().regex(/^-?\\d+(\\.\\d+)?$/, 'Expected an amount'), z.number()]);
`;

function refName(ref: string): string {
  return ref.split('/').pop() ?? ref;
}

function literal(value: unknown): string {
  return JSON.stringify(value);
}

/** One schema → a Zod expression, as source text. */
export function schemaToZod(schema: SpecSchema | undefined): string {
  if (!schema) return 'z.unknown()';

  let out: string;
  if (schema.$ref) {
    out = `z.lazy(() => S.${refName(schema.$ref)}!)`;
  } else if (schema.oneOf || schema.anyOf) {
    const members = (schema.oneOf ?? schema.anyOf)!.map(schemaToZod);
    out = members.length === 1 ? members[0]! : `z.union([${members.join(', ')}])`;
  } else if (schema.allOf) {
    const members = schema.allOf.map(schemaToZod);
    out = members.reduce((acc, next) => `z.intersection(${acc}, ${next})`);
  } else if (schema.enum && schema.enum.length > 0) {
    const literals = schema.enum.map((value) => `z.literal(${literal(value)})`);
    out = schema.enum.every((value) => typeof value === 'string')
      ? `z.enum([${schema.enum.map(literal).join(', ')}])`
      : literals.length === 1
        ? literals[0]!
        : `z.union([${literals.join(', ')}])`;
  } else {
    switch (schema.type) {
      case 'string':
        out = schema.format === 'amount' ? 'amount' : 'z.string()';
        break;
      case 'integer':
      case 'number':
        out = 'num';
        break;
      case 'boolean':
        out = 'bool';
        break;
      case 'array': {
        out = `z.array(${schemaToZod(schema.items)})`;
        if (schema.minItems !== undefined) out += `.min(${schema.minItems})`;
        if (schema.maxItems !== undefined) out += `.max(${schema.maxItems})`;
        break;
      }
      case 'object':
      case undefined:
        if (schema.properties) {
          out = objectToZod(schema);
        } else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
          out = `z.record(z.string(), ${schemaToZod(schema.additionalProperties)})`;
        } else {
          out = schema.type === 'object' ? 'z.record(z.string(), z.unknown())' : 'z.unknown()';
        }
        break;
      default:
        out = 'z.unknown()';
    }
  }

  return schema.nullable ? `${out}.nullable()` : out;
}

function objectToZod(schema: SpecSchema): string {
  const required = new Set(schema.required ?? []);
  const fields = Object.entries(schema.properties ?? {})
    .filter(([, property]) => !property.readOnly)
    .map(([name, property]) => {
      // Firefly validates `*_id` as numeric while the spec types it string,
      // so a client sending `12` for `"12"` is right and must not be refused.
      const isId = name.endsWith('_id') && property.type === 'string' && !property.enum;
      const value = isId ? (property.nullable ? 'id.nullable()' : 'id') : schemaToZod(property);
      return `${JSON.stringify(name)}: ${required.has(name) ? value : `${value}.optional()`}`;
    });
  return `z.looseObject({ ${fields.join(', ')} })`;
}

export interface RequestBodyRecord {
  method: string;
  path: string;
  pattern: string;
  schema: string;
  required: boolean;
}

/** The whole generated module. `schemas` are the component schemas reachable from a request body. */
export function renderRequestSchemas(
  version: string,
  schemas: Record<string, SpecSchema>,
  bodies: RequestBodyRecord[],
): string {
  const names = Object.keys(schemas).sort();
  const declarations = names.map((name) => `S.${name} = ${schemaToZod(schemas[name])};`).join('\n');
  const table = bodies
    .map(
      (body) =>
        `  { method: ${literal(body.method)}, path: ${literal(body.path)}, pattern: ${literal(body.pattern)}, schema: ${literal(body.schema)}, required: ${body.required} },`,
    )
    .join('\n');

  return `/* eslint-disable */
// Generated from spec/firefly-iii-v1.yaml (${version}).
// Run \`pnpm spec:codegen\` to regenerate. Do not edit. See scripts/spec-zod.ts.

${ZOD_PRELUDE}
const S: Record<string, z.ZodType> = {};
${declarations}

export const REQUEST_SCHEMAS: Readonly<Record<string, z.ZodType>> = S;

export interface RequestBodyRule {
  readonly method: 'post' | 'put' | 'patch';
  readonly path: string;
  /** Anchored regex matching a concrete request path. */
  readonly pattern: string;
  /** Key into REQUEST_SCHEMAS. */
  readonly schema: string;
  readonly required: boolean;
}

export const REQUEST_BODIES: readonly RequestBodyRule[] = [
${table}
];
`;
}

/** Every component schema reachable from `roots`, following \`$ref\`s. */
export function collectSchemas(
  all: Record<string, SpecSchema>,
  roots: string[],
): Record<string, SpecSchema> {
  const out: Record<string, SpecSchema> = {};
  const visit = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(visit);
    const record = node as Record<string, unknown>;
    if (typeof record.$ref === 'string') {
      const name = refName(record.$ref);
      if (!out[name] && all[name]) {
        out[name] = all[name];
        visit(all[name]);
      }
      return;
    }
    Object.values(record).forEach(visit);
  };
  roots.forEach((name) => visit({ $ref: `#/components/schemas/${name}` }));
  return out;
}
