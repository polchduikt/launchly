import { describe, it, expect } from 'vitest';
import { getFilterText } from './filterText';

describe('Filter Text Utility', () => {
  it('formats BY_TAG filter with specified tag value', () => {
    expect(getFilterText('BY_TAG', 'VIP')).toBe('Tag: VIP');
    expect(getFilterText('BY_TAG', '')).toBe('Tag: None');
  });

  it('formats HAS_ORDERS filter', () => {
    expect(getFilterText('HAS_ORDERS')).toBe('Users with Orders');
  });

  it('formats HAS_LEADS filter', () => {
    expect(getFilterText('HAS_LEADS')).toBe('Users with Leads');
  });

  it('falls back to All Bot Users for default or ALL filter', () => {
    expect(getFilterText('ALL')).toBe('All Bot Users');
    expect(getFilterText('UNKNOWN_TYPE')).toBe('All Bot Users');
  });
});
