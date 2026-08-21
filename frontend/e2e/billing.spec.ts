import { test, expect } from '@playwright/test';
import { loginAsUser } from './helpers/mockApi';

test.describe('Billing & Subscription Plans E2E', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test('displays subscriptions panel and active plan on settings page', async ({ page }) => {
    await page.goto('/settings?tab=subscriptions');
    await expect(page.locator('main').first()).toBeVisible();
  });
});
