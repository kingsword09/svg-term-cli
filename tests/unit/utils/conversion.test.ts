import { describe, it, expect } from 'vitest';
import { toNumber, toBoolean } from '../../../src/utils/conversion';

describe('Conversion utilities', () => {
  describe('toNumber', () => {
    it('should convert valid string to number', () => {
      expect(toNumber('42')).toBe(42);
      expect(toNumber('0')).toBe(0);
      expect(toNumber('-10')).toBe(-10);
    });

    it('should return undefined for invalid input', () => {
      expect(toNumber(null)).toBeUndefined();
      expect(toNumber('')).toBeUndefined();
      expect(toNumber('abc')).toBeUndefined();
    });
  });

  describe('toBoolean', () => {
    it('should handle boolean values correctly', () => {
      expect(toBoolean(true, false)).toBe(true);
      expect(toBoolean(false, true)).toBe(false);
    });

    it('should handle string values correctly', () => {
      expect(toBoolean('true', false)).toBe(true);
      expect(toBoolean('false', true)).toBe(false);
    });

    it('should return fallback for undefined', () => {
      expect(toBoolean(undefined, true)).toBe(true);
      expect(toBoolean(undefined, false)).toBe(false);
    });
  });
});