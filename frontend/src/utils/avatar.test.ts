import { describe, it, expect } from 'vitest';
import { isValidAvatarUrl, getInitials } from './avatar';

describe('Avatar Utils', () => {
  describe('isValidAvatarUrl', () => {
    it('returns true for valid http/https URLs', () => {
      expect(isValidAvatarUrl('https://example.com/avatar.png')).toBe(true);
      expect(isValidAvatarUrl('http://example.com/photo.jpg')).toBe(true);
    });

    it('returns true for data URLs and local paths', () => {
      expect(isValidAvatarUrl('data:image/png;base64,iVBORw0KGgo=')).toBe(true);
      expect(isValidAvatarUrl('/assets/default-avatar.svg')).toBe(true);
    });

    it('returns false for null, undefined, or empty strings', () => {
      expect(isValidAvatarUrl(null)).toBe(false);
      expect(isValidAvatarUrl(undefined)).toBe(false);
      expect(isValidAvatarUrl('')).toBe(false);
      expect(isValidAvatarUrl('   ')).toBe(false);
    });
  });

  describe('getInitials', () => {
    it('extracts two letters from two words name', () => {
      expect(getInitials('John Doe')).toBe('JD');
      expect(getInitials('Illia Mota')).toBe('IM');
    });

    it('takes first two letters for single word name', () => {
      expect(getInitials('Launchly')).toBe('LA');
    });

    it('returns fallback for empty or null names', () => {
      expect(getInitials(null)).toBe('U');
      expect(getInitials(undefined, 'BOT')).toBe('BOT');
      expect(getInitials('')).toBe('U');
    });
  });
});
