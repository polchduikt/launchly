import type { Page, Locator } from '@playwright/test';

export class SettingsPage {
  readonly page: Page;
  readonly tabs: Locator;
  readonly profileSection: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tabs = page.locator('nav button, [role="tab"]');
    this.profileSection = page.locator('main');
  }

  async goto(tab?: string): Promise<void> {
    const url = tab ? `/settings?tab=${tab}` : '/settings';
    await this.page.goto(url);
  }

  async selectTab(name: string | RegExp): Promise<void> {
    await this.page.getByRole('button', { name }).first().click();
  }
}
