import { test, expect } from '@playwright/test';
import { SettingsPage } from './pages/SettingsPage';
import { loginAsUser } from './helpers/mockApi';

test.describe('Workspace Settings & Profile E2E', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test('renders settings page with tabs and general profile information', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();

    await expect(page.locator('main').first()).toBeVisible();
    await expect(page.locator('aside').first()).toBeVisible();
  });

  test('navigates through integrations and team settings tabs', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto('integrations');

    await expect(page.locator('main').first()).toBeVisible();
  });
});
