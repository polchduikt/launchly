import type { Page, Route } from '@playwright/test';
import { MOCK_PLANS, MOCK_SUBSCRIPTION } from '../fixtures/billing.fixture';

export async function registerBillingMocks(page: Page): Promise<void> {
  await page.route('**/api/v1/billing/plans**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_PLANS),
    });
  });

  await page.route('**/api/v1/billing/subscription**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_SUBSCRIPTION),
    });
  });
}
