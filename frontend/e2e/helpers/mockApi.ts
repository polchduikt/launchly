import type { Page, Route } from '@playwright/test';
import { MOCK_USER, MOCK_ADMIN } from '../fixtures';
import {
  registerWsMocks,
  registerI18nMocks,
  registerAuthMocks,
  registerBotsMocks,
  registerCrmMocks,
  registerBillingMocks,
  registerBroadcastsMocks,
  registerAdminMocks,
} from '../mocks';

export async function setupApiMocks(page: Page): Promise<void> {
  await registerWsMocks(page);
  await registerI18nMocks(page);
  await registerAuthMocks(page);
  await registerBotsMocks(page);
  await registerCrmMocks(page);
  await registerBillingMocks(page);
  await registerBroadcastsMocks(page);
  await registerAdminMocks(page);

  await page.route('**/api/v1/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });
}

export async function loginAsUser(page: Page): Promise<void> {
  await setupApiMocks(page);
  await page.addInitScript((user) => {
    localStorage.setItem('accessToken', 'mock_jwt_token');
    localStorage.setItem('refreshToken', 'mock_refresh_token');
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('activeBotId', '1');
  }, MOCK_USER);
}

export async function loginAsAdmin(page: Page): Promise<void> {
  await setupApiMocks(page);
  await page.route('**/api/v1/auth/me', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_ADMIN),
    });
  });
  await page.addInitScript((admin) => {
    localStorage.setItem('accessToken', 'mock_jwt_admin_token');
    localStorage.setItem('refreshToken', 'mock_refresh_admin_token');
    localStorage.setItem('user', JSON.stringify(admin));
  }, MOCK_ADMIN);
}
