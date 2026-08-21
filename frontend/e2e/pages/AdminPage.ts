import type { Page, Locator } from '@playwright/test';

export class AdminPage {
  readonly page: Page;
  readonly adminNavLinks: Locator;
  readonly statsCards: Locator;
  readonly usersTable: Locator;

  constructor(page: Page) {
    this.page = page;
    this.adminNavLinks = page.locator('aside a[href*="/admin"]');
    this.statsCards = page.locator('[data-testid="stat-card"], .stat-card, div:has-text("1420")');
    this.usersTable = page.locator('table');
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin/stats');
  }

  async gotoStats(): Promise<void> {
    await this.page.goto('/admin/stats');
  }

  async gotoUsers(): Promise<void> {
    await this.page.goto('/admin/users');
  }
}
