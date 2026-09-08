import { describe, it, expect } from 'vitest';
import { isAdminOrManager, getSafeRedirectUrl } from './auth';

describe('auth utils', () => {
  describe('isAdminOrManager', () => {
    it('returns true for ROLE_ADMIN and ROLE_MANAGER', () => {
      expect(isAdminOrManager('ROLE_ADMIN')).toBe(true);
      expect(isAdminOrManager('ROLE_MANAGER')).toBe(true);
    });

    it('returns false for other roles or null', () => {
      expect(isAdminOrManager('ROLE_OWNER')).toBe(false);
      expect(isAdminOrManager('ROLE_USER')).toBe(false);
      expect(isAdminOrManager(null)).toBe(false);
      expect(isAdminOrManager(undefined)).toBe(false);
    });
  });

  describe('getSafeRedirectUrl', () => {
    it('allows valid relative paths', () => {
      expect(getSafeRedirectUrl('/dashboard')).toBe('/dashboard');
      expect(getSafeRedirectUrl('/settings?tab=general')).toBe('/settings?tab=general');
      expect(getSafeRedirectUrl('/broadcasts/123')).toBe('/broadcasts/123');
    });

    it('blocks external URLs and protocol schemes', () => {
      expect(getSafeRedirectUrl('https://evil.com')).toBeNull();
      expect(getSafeRedirectUrl('http://evil.com')).toBeNull();
      expect(getSafeRedirectUrl('javascript:alert(1)')).toBeNull();
      expect(getSafeRedirectUrl('data:text/html,...')).toBeNull();
    });

    it('blocks protocol-relative URLs (//evil.com)', () => {
      expect(getSafeRedirectUrl('//evil.com')).toBeNull();
      expect(getSafeRedirectUrl('//evil.com/path')).toBeNull();
    });

    it('blocks windows-style backslashes and null/empty input', () => {
      expect(getSafeRedirectUrl('/\\evil.com')).toBeNull();
      expect(getSafeRedirectUrl('\\evil.com')).toBeNull();
      expect(getSafeRedirectUrl('')).toBeNull();
      expect(getSafeRedirectUrl(null)).toBeNull();
      expect(getSafeRedirectUrl(undefined)).toBeNull();
    });
  });
});
