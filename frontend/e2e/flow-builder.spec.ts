import { test, expect } from '@playwright/test';
import { FlowBuilderPage } from './pages/FlowBuilderPage';
import { loginAsUser } from './helpers/mockApi';

test.describe('Flow Builder Canvas E2E', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test('loads ReactFlow canvas with initial flow nodes', async ({ page }) => {
    const builderPage = new FlowBuilderPage(page);
    await builderPage.goto(1);

    await expect(builderPage.reactFlowCanvas.first()).toBeVisible();
  });

  test('displays undo and redo toolbar buttons', async ({ page }) => {
    const builderPage = new FlowBuilderPage(page);
    await builderPage.goto(1);

    await expect(builderPage.undoButton.first()).toBeVisible();
  });
});
