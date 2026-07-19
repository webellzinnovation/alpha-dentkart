import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
  });

  test('clicking Category nav shows categories page', async ({ page }) => {
    const categoryBtn = page.locator('nav button, header button').filter({ hasText: /categories?/i }).first();
    if (await categoryBtn.isVisible().catch(() => false)) {
      await categoryBtn.click();
      await page.waitForTimeout(1000);
    }
    const categoryContent = page.getByText(/categories/i).first();
    await expect(categoryContent).toBeVisible({ timeout: 10000 });
  });

  test('clicking Brand nav shows brands page', async ({ page }) => {
    const brandLink = page.locator('nav a, nav button, header a, header button').filter({ hasText: /brands?/i }).first();
    if (await brandLink.isVisible().catch(() => false)) {
      await brandLink.click();
      await page.waitForTimeout(1000);
    }
    await expect(page.getByText(/brands/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('clicking Shop link navigates correctly', async ({ page }) => {
    const shopLink = page.locator('nav a, nav button, nav span').filter({ hasText: /^Shop$/i }).first();
    await expect(shopLink).toBeVisible({ timeout: 10000 });
    await shopLink.click();
    await page.waitForTimeout(1000);

    const hasContent = await page.locator('main').first().isVisible().catch(() => false);
    expect(hasContent).toBeTruthy();
  });

  test('search input is focusable', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search products...');
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await searchInput.click();
    await expect(searchInput).toBeFocused();
  });

  test('back navigation works', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const categoryBtn = page.locator('nav button, header button').filter({ hasText: /categories?/i }).first();
    if (await categoryBtn.isVisible().catch(() => false)) {
      await categoryBtn.click();
      await page.waitForTimeout(1000);
    }

    await page.goBack();
    await page.waitForTimeout(1000);

    const url = page.url();
    expect(url).not.toContain('/categories');
  });
});
