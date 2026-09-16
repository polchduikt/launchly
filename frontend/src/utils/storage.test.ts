import { describe, it, expect, beforeEach, vi } from 'vitest';
import { safeStorage } from './storage';

describe('safeStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('getItem & setItem', () => {
    it('sets and gets raw strings', () => {
      expect(safeStorage.setItem('test_key', 'hello')).toBe(true);
      expect(safeStorage.getItem('test_key')).toBe('hello');
    });

    it('returns null when item does not exist', () => {
      expect(safeStorage.getItem('nonexistent')).toBeNull();
    });

    it('returns null and false when localStorage throws', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError: Access is denied');
      });
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      expect(safeStorage.getItem('test_key')).toBeNull();
      expect(safeStorage.setItem('test_key', 'val')).toBe(false);
    });
  });

  describe('removeItem', () => {
    it('removes item successfully', () => {
      safeStorage.setItem('remove_me', 'val');
      expect(safeStorage.removeItem('remove_me')).toBe(true);
      expect(safeStorage.getItem('remove_me')).toBeNull();
    });

    it('handles removal errors gracefully', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });
      expect(safeStorage.removeItem('key')).toBe(false);
    });
  });

  describe('getJSON & setJSON', () => {
    it('serializes and deserializes objects correctly', () => {
      const data = { id: 1, name: 'Test', active: true };
      expect(safeStorage.setJSON('obj_key', data)).toBe(true);
      expect(safeStorage.getJSON('obj_key', null)).toEqual(data);
    });

    it('returns fallback when key is not found', () => {
      expect(safeStorage.getJSON('not_found', { fallback: true })).toEqual({ fallback: true });
    });

    it('returns fallback when JSON parsing throws', () => {
      localStorage.setItem('corrupted_json', '{broken-json');
      expect(safeStorage.getJSON('corrupted_json', ['fallback'])).toEqual(['fallback']);
    });

    it('returns fallback when localStorage throws on getJSON', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });
      expect(safeStorage.getJSON('any_key', 42)).toBe(42);
    });
  });
});
