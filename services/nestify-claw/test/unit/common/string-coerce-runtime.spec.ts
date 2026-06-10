/**
 * Ported from openclaw/packages/normalization-core string-coerce and
 * string-normalization tests, adapted to nestify-claw's hand-written
 * string-coerce-runtime module (@nestify-real).
 */
import {
  isRecord,
  normalizeLowercaseStringOrEmpty,
  normalizeNullableString,
  normalizeOptionalLowercaseString,
  normalizeOptionalString,
  normalizeStringEntries,
  readStringValue,
  uniqueStrings,
} from '../../../src/common/openclaw/plugin-sdk/string-coerce-runtime';

describe('string-coerce-runtime', () => {
  describe('readStringValue', () => {
    it('returns strings unchanged, including whitespace', () => {
      expect(readStringValue(' hello ')).toBe(' hello ');
      expect(readStringValue('')).toBe('');
    });

    it('returns undefined for non-strings', () => {
      expect(readStringValue(42)).toBeUndefined();
      expect(readStringValue(null)).toBeUndefined();
      expect(readStringValue(undefined)).toBeUndefined();
      expect(readStringValue({})).toBeUndefined();
    });
  });

  describe('normalizeNullableString', () => {
    it('trims and returns null for empty or non-string input', () => {
      expect(normalizeNullableString('  hi  ')).toBe('hi');
      expect(normalizeNullableString('')).toBeNull();
      expect(normalizeNullableString('   ')).toBeNull();
      expect(normalizeNullableString(0)).toBeNull();
      expect(normalizeNullableString(null)).toBeNull();
    });
  });

  describe('normalizeOptionalString', () => {
    it('maps empty results to undefined', () => {
      expect(normalizeOptionalString(' ok ')).toBe('ok');
      expect(normalizeOptionalString('')).toBeUndefined();
      expect(normalizeOptionalString(false)).toBeUndefined();
    });
  });

  describe('normalizeOptionalLowercaseString', () => {
    it('lowercases normalized optional strings', () => {
      expect(normalizeOptionalLowercaseString(' MiXeD ')).toBe('mixed');
      expect(normalizeOptionalLowercaseString('')).toBeUndefined();
    });
  });

  describe('normalizeLowercaseStringOrEmpty', () => {
    it('returns lowercase string or empty string', () => {
      expect(normalizeLowercaseStringOrEmpty(' Team ')).toBe('team');
      expect(normalizeLowercaseStringOrEmpty(null)).toBe('');
    });
  });

  describe('normalizeStringEntries', () => {
    it('normalizes mixed allow-list entries (openclaw string-normalization parity)', () => {
      expect(normalizeStringEntries([' a ', 42, '', '  ', 'z'])).toEqual([
        'a',
        '42',
        'z',
      ]);
      expect(
        normalizeStringEntries([' ok ', null, { toString: () => ' obj ' }]),
      ).toEqual(['ok', 'null', 'obj']);
      expect(normalizeStringEntries(undefined)).toEqual([]);
    });
  });

  describe('uniqueStrings', () => {
    it('deduplicates while preserving first-seen order', () => {
      expect(uniqueStrings(['b', 'a', 'b', 'c', 'a'])).toEqual(['b', 'a', 'c']);
    });
  });

  describe('isRecord', () => {
    it('accepts plain objects only', () => {
      expect(isRecord({ a: 1 })).toBe(true);
      expect(isRecord([])).toBe(false);
      expect(isRecord(null)).toBe(false);
      expect(isRecord('x')).toBe(false);
    });
  });
});
