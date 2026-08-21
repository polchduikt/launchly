import type { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly botList: Locator;
  readonly createBotButton: Locator;
  readonly botModalInput: Locator;
  readonly botModalSubmit: Locator;

  constructor(page: Page) {
    this.page = page;
    this.botList = page.locator('[data-testid="bot-card"], .bot-card, a[href*="/builder"]');
    this.createBotButton = page.getByRole('button', { name: /створити бота|create bot|\+/i });
    this.botModalInput = page.locator('input[placeholder*="назва"], input[placeholder*="Name"], input[name="name"]');
    this.botModalSubmit = page.locator('button[type="submit"], button:has-text("Створити"), button:has-text("Create")');
  }

  async goto(): Promise<void> {
    await this.page.goto('/home');
  }
}
