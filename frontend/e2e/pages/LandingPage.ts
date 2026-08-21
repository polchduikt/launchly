import type { Page, Locator } from '@playwright/test';

export class LandingPage {
  readonly page: Page;
  readonly logo: Locator;
  readonly loginButton: Locator;
  readonly registerButton: Locator;
  readonly languageButton: Locator;
  readonly featuresSection: Locator;
  readonly pricingSection: Locator;

  constructor(page: Page) {
    this.page = page;
    this.logo = page.locator('img[alt*="Logo"], img[alt*="Launchly"]').first();
    this.loginButton = page.locator('header').getByRole('button', { name: /увійти|login/i });
    this.registerButton = page.locator('header').getByRole('button', { name: /реєстрація|register/i });
    this.languageButton = page.locator('header').locator('button').filter({ hasText: /uk|en/i });
    this.featuresSection = page.locator('#features, [id*="feature"]');
    this.pricingSection = page.locator('#pricing, [id*="pricing"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }
}
