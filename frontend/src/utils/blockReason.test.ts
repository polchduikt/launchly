import { describe, it, expect, vi } from 'vitest';
import { translateBlockReason } from './blockReason';

let mockLang = 'uk';
vi.mock('../i18n/config', () => ({
  t: (k: string) => k,
  getLanguage: () => mockLang,
}));

describe('translateBlockReason', () => {
  it('returns empty string for null or undefined', () => {
    expect(translateBlockReason(null)).toBe('');
    expect(translateBlockReason(undefined)).toBe('');
  });

  it('translates known reasons to Ukrainian when lang is uk', () => {
    mockLang = 'uk';
    expect(translateBlockReason('Suspicious activity')).toBe('Підозріла активність');
    expect(translateBlockReason('Violation of platform rules')).toBe('Порушення правил платформи');
    expect(translateBlockReason('Spam or unauthorized bulk messaging')).toBe('Спам або несанкціонована розсилка');
    expect(translateBlockReason('Other reason')).toBe('Інша причина');
  });

  it('translates Ukrainian reasons to English when lang is en', () => {
    mockLang = 'en';
    expect(translateBlockReason('Підозріла активність')).toBe('Suspicious activity');
    expect(translateBlockReason('Порушення правил платформи')).toBe('Violation of platform rules');
    expect(translateBlockReason('Other reason')).toBe('Other reason');
  });

  it('falls back to reason or t(reason) for custom unknown reason', () => {
    mockLang = 'uk';
    expect(translateBlockReason('Custom violation text')).toBe('Custom violation text');
  });
});
