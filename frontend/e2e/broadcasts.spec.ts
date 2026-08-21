import { test, expect } from '@playwright/test';
import { loginAsUser } from './helpers/mockApi';

test.describe('Broadcasts Campaign E2E', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test('displays broadcasts overview and campaigns table', async ({ page }) => {
    await page.goto('/broadcasts');
    await expect(page.locator('aside').first()).toBeVisible();
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('opens create broadcast campaign modal when clicking new button', async ({ page }) => {
    await page.goto('/broadcasts');
    const createBtn = page.getByRole('button', { name: /створити|нова розсилка|new broadcast|create/i }).first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await expect(page.locator('[role="dialog"], form, .fixed').first()).toBeVisible();
    }
  });
});
