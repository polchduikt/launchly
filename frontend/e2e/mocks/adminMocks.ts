import type { Page, Route } from '@playwright/test';
import { MOCK_ADMIN_STATS } from '../fixtures/admin.fixture';
import { MOCK_USER } from '../fixtures/auth.fixture';

export async function registerAdminMocks(page: Page): Promise<void> {
  await page.route('**/api/v1/admin/stats**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_ADMIN_STATS),
    });
  });

  await page.route('**/api/v1/admin/users**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: [
          MOCK_USER,
          { id: 2, email: 'client2@test.com', name: 'Client Two', role: 'ROLE_USER', timezone: 'UTC' },
        ],
        totalPages: 1,
        totalElements: 2,
      }),
    });
  });
}
