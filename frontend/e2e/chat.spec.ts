import { test, expect } from '@playwright/test';
import { ChatPage } from './pages/ChatPage';
import { loginAsUser } from './helpers/mockApi';

test.describe('Live Chat & CRM E2E', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test('displays conversation list and workspace layout', async ({ page }) => {
    const chatPage = new ChatPage(page);
    await chatPage.goto(1);

    await expect(page.locator('aside').first()).toBeVisible();
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('navigates between chat sidebar filter tabs', async ({ page }) => {
    const chatPage = new ChatPage(page);
    await chatPage.goto(1);

    const filterButton = page.locator('nav button, button:has-text("Всі"), button:has-text("All")').first();
    await expect(filterButton).toBeVisible();
  });
});
