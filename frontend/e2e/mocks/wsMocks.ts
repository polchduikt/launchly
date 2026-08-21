import type { Page, Route } from '@playwright/test';

export async function registerWsMocks(page: Page): Promise<void> {
  await page.route('**/ws/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  });
}
