import type { Page, Locator } from '@playwright/test';

export class AuthPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly nameInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.nameInput = page.locator('#firstName');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('[role="alert"], .text-red-500, .text-rose-500');
  }

  async gotoLogin(): Promise<void> {
    await this.page.goto('/login');
    await this.emailInput.waitFor({ state: 'visible' });
  }

  async gotoRegister(): Promise<void> {
    await this.page.goto('/register');
    await this.nameInput.waitFor({ state: 'visible' });
  }

  async login(email: string, pass: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(pass);
    await this.submitButton.click();
  }

  async register(name: string, email: string, pass: string): Promise<void> {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(pass);
    await this.submitButton.click();
  }
}
