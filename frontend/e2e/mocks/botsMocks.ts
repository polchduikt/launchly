import type { Page, Route } from '@playwright/test';
import { MOCK_BOTS, MOCK_FLOW_SCHEMA } from '../fixtures/bots.fixture';

export async function registerBotsMocks(page: Page): Promise<void> {
  await page.route('**/api/v1/bots/*/schema', async (route: Route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_FLOW_SCHEMA),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    }
  });

  await page.route('**/api/v1/bots**', async (route: Route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_BOTS),
      });
    } else {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_BOTS[0]),
      });
    }
  });
}
