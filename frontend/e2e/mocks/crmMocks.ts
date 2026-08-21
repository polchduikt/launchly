import type { Page, Route } from '@playwright/test';
import { MOCK_CONVERSATIONS, MOCK_MESSAGES } from '../fixtures/crm.fixture';

export async function registerCrmMocks(page: Page): Promise<void> {
  await page.route('**/api/v1/crm/conversations/*/messages**', async (route: Route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_MESSAGES),
      });
    } else {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_MESSAGES[0]),
      });
    }
  });

  await page.route('**/api/v1/crm/conversations**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_CONVERSATIONS),
    });
  });

  await page.route('**/api/v1/crm/bot-users**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: [
          {
            id: 201,
            telegramId: 123456,
            firstName: 'Alex',
            lastName: 'Client',
            username: 'alexclient',
            createdAt: '2025-01-01T10:00:00Z',
            tags: [],
          },
        ],
        totalPages: 1,
        totalElements: 1,
      }),
    });
  });
}
