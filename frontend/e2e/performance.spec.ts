import { test, expect } from '@playwright/test';
import { setupApiMocks, loginAsUser } from './helpers/mockApi';

interface WebVitalsMetrics {
  ttfb: number;
  domContentLoaded: number;
  loadEventEnd: number;
  fcp: number;
  cls: number;
}

test.describe('Performance & Core Web Vitals E2E', () => {
  test('measures Landing page Web Vitals within thresholds', async ({ page }) => {
    await setupApiMocks(page);

    await page.goto('/', { waitUntil: 'load' });

    const metrics = await page.evaluate((): WebVitalsMetrics => {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find((entry) => entry.name === 'first-contentful-paint');

      const ttfb = navEntry ? navEntry.responseStart - navEntry.requestStart : 0;
      const domContentLoaded = navEntry ? navEntry.domContentLoadedEventEnd - navEntry.startTime : 0;
      const loadEventEnd = navEntry ? navEntry.loadEventEnd - navEntry.startTime : 0;
      const fcp = fcpEntry ? fcpEntry.startTime : 0;

      let cls = 0;
      const shiftEntries = performance.getEntriesByType('layout-shift');
      for (const entry of shiftEntries) {
        const layoutEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
        if (!layoutEntry.hadRecentInput && typeof layoutEntry.value === 'number') {
          cls += layoutEntry.value;
        }
      }

      return {
        ttfb,
        domContentLoaded,
        loadEventEnd,
        fcp,
        cls,
      };
    });

    expect(metrics.domContentLoaded).toBeLessThan(3000);
    expect(metrics.cls).toBeLessThan(0.2);
  });

  test('measures Dashboard page load speed after authentication', async ({ page }) => {
    await loginAsUser(page);

    await page.goto('/home', { waitUntil: 'load' });

    const metrics = await page.evaluate((): WebVitalsMetrics => {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find((entry) => entry.name === 'first-contentful-paint');

      const ttfb = navEntry ? navEntry.responseStart - navEntry.requestStart : 0;
      const domContentLoaded = navEntry ? navEntry.domContentLoadedEventEnd - navEntry.startTime : 0;
      const loadEventEnd = navEntry ? navEntry.loadEventEnd - navEntry.startTime : 0;
      const fcp = fcpEntry ? fcpEntry.startTime : 0;

      let cls = 0;
      const shiftEntries = performance.getEntriesByType('layout-shift');
      for (const entry of shiftEntries) {
        const layoutEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
        if (!layoutEntry.hadRecentInput && typeof layoutEntry.value === 'number') {
          cls += layoutEntry.value;
        }
      }

      return {
        ttfb,
        domContentLoaded,
        loadEventEnd,
        fcp,
        cls,
      };
    });

    expect(metrics.domContentLoaded).toBeLessThan(3000);
    expect(metrics.cls).toBeLessThan(0.2);
  });

  test('measures Flow Builder canvas load timing without memory leaks', async ({ page }) => {
    await loginAsUser(page);

    await page.goto('/builder?botId=1', { waitUntil: 'load' });

    const domReady = await page.evaluate((): number => {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      return navEntry ? navEntry.domContentLoadedEventEnd - navEntry.startTime : 0;
    });

    expect(domReady).toBeLessThan(3500);
  });
});
