/**
 * @kitty-real
 *
 * Real implementation of the openclaw `string-coerce-runtime` leaf utilities.
 * These are pure functions ported from openclaw's normalization-core; they are
 * on the inbound read path (used by the Telegram extension's body helpers), so
 * they must behave correctly rather than stub out.
 */

/** Reads a value only when it is already a string, preserving whitespace. */
export function readStringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/** Trims string input and returns null for non-strings or empty strings. */
export function normalizeNullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

/** Trims string input and returns undefined for non-strings or empty strings. */
export function normalizeOptionalString(value: unknown): string | undefined {
  return normalizeNullableString(value) ?? undefined;
}

/** Lowercases a normalized optional string. */
export function normalizeOptionalLowercaseString(
  value: unknown,
): string | undefined {
  return normalizeOptionalString(value)?.toLowerCase();
}

/** Lowercases a normalized string or returns an empty string when absent. */
export function normalizeLowercaseStringOrEmpty(value: unknown): string {
  return normalizeOptionalLowercaseString(value) ?? '';
}

/** Coerces entries to strings, trims them, and drops empty results. */
export function normalizeStringEntries(
  list?: ReadonlyArray<unknown>,
): string[] {
  return (list ?? [])
    .map((entry) => normalizeOptionalString(String(entry)) ?? '')
    .filter(Boolean);
}

/** Returns first-seen unique strings while preserving insertion order. */
export function uniqueStrings(values: Iterable<string>): string[] {
  return [...new Set(values)];
}

/** Type guard for plain object records. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
