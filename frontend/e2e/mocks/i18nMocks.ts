import type { Page, Route } from '@playwright/test';

export async function registerI18nMocks(page: Page): Promise<void> {
  await page.route('**/api/i18n/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  });
}
