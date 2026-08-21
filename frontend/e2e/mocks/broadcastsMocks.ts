import type { Page, Route } from '@playwright/test';
import { MOCK_CAMPAIGNS } from '../fixtures/broadcasts.fixture';

export async function registerBroadcastsMocks(page: Page): Promise<void> {
  await page.route('**/api/v1/broadcast/campaigns**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_CAMPAIGNS),
    });
  });
}
