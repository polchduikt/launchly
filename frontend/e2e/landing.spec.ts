import { test, expect } from '@playwright/test';
import { LandingPage } from './pages/LandingPage';
import { setupApiMocks } from './helpers/mockApi';

test.describe('Landing Page E2E', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test('renders landing header, logo, and action buttons', async ({ page }) => {
    const landingPage = new LandingPage(page);
    await landingPage.goto();

    await expect(landingPage.logo).toBeVisible();
    await expect(landingPage.loginButton).toBeVisible();
    await expect(landingPage.registerButton).toBeVisible();
  });

  test('navigates to login page on login button click', async ({ page }) => {
    const landingPage = new LandingPage(page);
    await landingPage.goto();

    await landingPage.loginButton.click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('navigates to register page on register button click', async ({ page }) => {
    const landingPage = new LandingPage(page);
    await landingPage.goto();

    await landingPage.registerButton.click();
    await expect(page).toHaveURL(/\/register/);
  });
});
