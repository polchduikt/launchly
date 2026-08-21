import { test, expect } from '@playwright/test';
import { loginAsUser } from './helpers/mockApi';

test.describe('Dashboard & Bot Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test('displays home page overview when logged in', async ({ page }) => {
    await page.goto('/home');
    await expect(page.locator('aside').first()).toBeVisible();
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('displays bot list on automations page', async ({ page }) => {
    await page.goto('/automations');
    await expect(page.locator('aside').first()).toBeVisible();
    await expect(page.locator('main').first()).toBeVisible();
  });
});
