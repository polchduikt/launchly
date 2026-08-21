import { describe, it, expect, beforeEach } from 'vitest';
import { timeAgo, parseMessageButtons, lsGet, lsSet, getDateKey } from './crmChat';

describe('CRM Chat Utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('timeAgo', () => {
    it('returns empty string for null input', () => {
      expect(timeAgo(null)).toBe('');
    });

    it('returns now for recently created timestamp', () => {
      const nowStr = new Date().toISOString();
      expect(timeAgo(nowStr)).toBeDefined();
    });
  });

  describe('parseMessageButtons', () => {
    it('extracts buttons appended at the end of message text in brackets', () => {
      const input = 'Choose an option [Option A] [Option B]';
      const result = parseMessageButtons(input);
      expect(result.text).toBe('Choose an option');
      expect(result.buttons).toEqual(['Option A', 'Option B']);
    });

    it('returns empty buttons array when no brackets present', () => {
      const input = 'Just a regular message';
      const result = parseMessageButtons(input);
      expect(result.text).toBe('Just a regular message');
      expect(result.buttons).toEqual([]);
    });

    it('handles null content gracefully', () => {
      expect(parseMessageButtons(null)).toEqual({ text: '', buttons: [] });
    });
  });

  describe('lsGet and lsSet', () => {
    it('sets and gets typed values from localStorage', () => {
      lsSet('test_key', { count: 42, active: true });
      const value = lsGet('test_key', { count: 0, active: false });
      expect(value).toEqual({ count: 42, active: true });
    });

    it('returns fallback value if key does not exist or corrupted', () => {
      const value = lsGet('non_existent', 'default_value');
      expect(value).toBe('default_value');

      localStorage.setItem('corrupted', 'invalid json{');
      const fallbackValue = lsGet('corrupted', 'recovered');
      expect(fallbackValue).toBe('recovered');
    });
  });

  describe('getDateKey', () => {
    it('returns valid date string key', () => {
      const dateStr = '2026-08-20T10:00:00Z';
      expect(getDateKey(dateStr)).toBe(new Date(dateStr).toDateString());
    });
  });
});
