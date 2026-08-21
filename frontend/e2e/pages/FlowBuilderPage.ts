import type { Page, Locator } from '@playwright/test';

export class FlowBuilderPage {
  readonly page: Page;
  readonly reactFlowCanvas: Locator;
  readonly nodes: Locator;
  readonly undoButton: Locator;
  readonly redoButton: Locator;
  readonly publishButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.reactFlowCanvas = page.locator('.react-flow__viewport, .react-flow__pane');
    this.nodes = page.locator('.react-flow__node');
    this.undoButton = page.locator('button[title*="Undo"]');
    this.redoButton = page.locator('button[title*="Redo"]');
    this.publishButton = page.locator('button:has-text("Опублікувати"), button:has-text("Запустити"), button:has-text("Publish")');
  }

  async goto(botId: number = 1): Promise<void> {
    await this.page.goto(`/builder?botId=${botId}`);
  }
}
