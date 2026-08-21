import type { Page, Route } from '@playwright/test';
import { MOCK_USER, MOCK_ADMIN } from '../fixtures/auth.fixture';

export async function registerAuthMocks(page: Page): Promise<void> {
  await page.route('**/api/v1/auth/me', async (route: Route) => {
    const headers = route.request().headers();
    const authHeader = headers['authorization'] || headers['Authorization'] || '';
    if (authHeader.toLowerCase().includes('admin')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ADMIN),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_USER),
    });
  });

  await page.route('**/api/v1/auth/login', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'mock_access_token_jwt',
        refreshToken: 'mock_refresh_token_jwt',
        user: MOCK_USER,
      }),
    });
  });

  await page.route('**/api/v1/auth/register', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'mock_access_token_jwt',
        refreshToken: 'mock_refresh_token_jwt',
        user: MOCK_USER,
      }),
    });
  });

  await page.route('**/api/v1/auth/refresh', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'mock_access_token_jwt',
        refreshToken: 'mock_refresh_token_jwt',
        user: MOCK_USER,
      }),
    });
  });
}
