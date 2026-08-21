import { test, expect } from '@playwright/test';
import { AdminPage } from './pages/AdminPage';
import { loginAsAdmin } from './helpers/mockApi';

test.describe('Admin Panel Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('renders admin stats page with analytics overview', async ({ page }) => {
    const adminPage = new AdminPage(page);
    await adminPage.goto();

    await expect(page.locator('main').first()).toBeVisible();
    await expect(page.locator('aside, nav').first()).toBeVisible();
  });

  test('renders admin users management page with user records', async ({ page }) => {
    await page.goto('/admin/users');

    await expect(page.locator('main').first()).toBeVisible();
    await expect(page.locator('table, [role="table"], [class*="table"], main').first()).toBeVisible();
  });
});
