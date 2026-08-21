import type { Page, Locator } from '@playwright/test';

export class BroadcastPage {
  readonly page: Page;
  readonly createCampaignButton: Locator;
  readonly campaignRows: Locator;
  readonly campaignDialog: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createCampaignButton = page.getByRole('button', { name: /нова розсилка|створити розсилку|new broadcast|create/i });
    this.campaignRows = page.locator('table tbody tr, [data-testid="campaign-card"]');
    this.campaignDialog = page.locator('[role="dialog"]');
  }

  async goto(botId: number = 1): Promise<void> {
    await this.page.goto(`/broadcasts?botId=${botId}`);
  }
}
