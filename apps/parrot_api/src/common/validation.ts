import { BadRequestException } from '@nestjs/common';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function requireString(
  value: unknown,
  field: string,
  options: { maxLength?: number; minLength?: number } = {},
): string {
  if (typeof value !== 'string') {
    throw new BadRequestException(`${field} must be a string`);
  }
  if (options.minLength !== undefined && value.length < options.minLength) {
    throw new BadRequestException(
      `${field} must be at least ${options.minLength} characters`,
    );
  }
  if (options.maxLength !== undefined && value.length > options.maxLength) {
    throw new BadRequestException(
      `${field} must be at most ${options.maxLength} characters`,
    );
  }
  return value;
}

/** For optional body fields: `undefined` passes through untouched (leave unchanged), but a
 * present value must still be a well-formed string. */
export function optionalString(
  value: unknown,
  field: string,
  options: { maxLength?: number } = {},
): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  return requireString(value, field, options);
}

/** Trims and maps an optional, possibly-blank string field to `null` for storage - distinguishes
 * "leave unchanged" (undefined) from "clear this field" (empty/whitespace -> null). */
export function optionalNullableString(
  value: unknown,
  field: string,
  options: { maxLength?: number } = {},
): string | null | undefined {
  const str = optionalString(value, field, options);
  if (str === undefined) {
    return undefined;
  }
  const trimmed = str.trim();
  return trimmed === '' ? null : trimmed;
}

export function requireUuid(value: unknown, field: string): string {
  const str = requireString(value, field);
  if (!UUID_RE.test(str)) {
    throw new BadRequestException(`${field} must be a valid UUID`);
  }
  return str;
}

export function optionalUuid(
  value: unknown,
  field: string,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  return requireUuid(value, field);
}

/** Validates an ISO-8601 date-time string and returns it normalized (Date#toISOString) - callers
 * store the normalized form so downstream formatting/sorting never sees the original, looser
 * client-supplied string. */
/** Escapes `\`, `%` and `_` for use inside an ILIKE pattern (with ESCAPE '\\') - without this, a
 * search query containing those characters would be interpreted as wildcards/escapes instead of
 * literal text. */
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export function requireIsoDate(value: unknown, field: string): string {
  const str = requireString(value, field);
  const parsed = new Date(str);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(`${field} must be a valid date-time`);
  }
  return parsed.toISOString();
}
