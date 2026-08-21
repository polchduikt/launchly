import { test, expect } from '@playwright/test';
import { AuthPage } from './pages/AuthPage';
import { setupApiMocks } from './helpers/mockApi';

test.describe('Authentication & Route Protection E2E', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test('redirects unauthenticated user from protected route to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('successful login redirects to /home', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.gotoLogin();

    await authPage.login('owner@launchly.app', 'Secret123!');
    await expect(page).toHaveURL(/\/home/);
  });

  test('successful registration redirects user to /home', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.gotoRegister();

    await authPage.register('New User', 'newuser@launchly.app', 'Secret123!');
    await expect(page).toHaveURL(/\/home/);
  });
});
