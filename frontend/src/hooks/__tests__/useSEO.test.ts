import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSEO } from '../useSEO';

describe('useSEO', () => {
  it('updates document title and meta tags', () => {
    renderHook(() =>
      useSEO({
        title: 'Dashboard Page',
        description: 'Launchly dashboard page description',
      })
    );

    expect(document.title).toContain('Dashboard Page');

    const descMeta = document.querySelector('meta[name="description"]');
    expect(descMeta?.getAttribute('content')).toBe('Launchly dashboard page description');
  });
});
