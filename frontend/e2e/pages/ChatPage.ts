import type { Page, Locator } from '@playwright/test';

export class ChatPage {
  readonly page: Page;
  readonly conversationList: Locator;
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.conversationList = page.locator('[data-testid="conversation-item"], [class*="ConversationList"], [class*="conversation"]');
    this.messageInput = page.locator('textarea, input[placeholder*="Повідомлення"], input[placeholder*="Message"]');
    this.sendButton = page.locator('button[type="submit"], button:has-text("Send"), button:has-text("Надіслати")');
    this.searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Пошук"]');
  }

  async goto(botId: number = 1): Promise<void> {
    await this.page.goto(`/chat?botId=${botId}`);
  }
}
