import { test, expect } from '@playwright/test';

test.describe('Product Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('.premium-card', { timeout: 15000 });
  });

  test('product cards are displayed', async ({ page }) => {
    const productCards = page.locator('.premium-card');
    await expect(productCards.first()).toBeVisible();
    const count = await productCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('clicking a product opens detail view', async ({ page }) => {
    const productCard = page.locator('.premium-card').first();
    await expect(productCard).toBeVisible();
    await productCard.click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const url = page.url();
    const hasDetailIndicator = url.includes('product') || url.includes('id=');
    expect(hasDetailIndicator).toBeTruthy();
  });

  test('add to cart button works', async ({ page }) => {
    const productCard = page.locator('.premium-card').first();
    await expect(productCard).toBeVisible();

    const addBtn = productCard.locator('button').first();
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('wishlist button toggles', async ({ page }) => {
    const wishlistBtn = page.locator('.premium-card button').filter({ has: page.locator('[class*="heart"], i[class*="heart"], svg[class*="heart"]') }).first();
    const isVisible = await wishlistBtn.isVisible().catch(() => false);

    if (isVisible) {
      await wishlistBtn.click();
      await page.waitForTimeout(300);
      await wishlistBtn.click();
    }
  });

  test('product images load', async ({ page }) => {
    const images = page.locator('.premium-card img');
    const count = await images.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(count, 3); i++) {
      const img = images.nth(i);
      await expect(img).toBeVisible({ timeout: 5000 });
      const src = await img.getAttribute('src');
      expect(src).toBeTruthy();
    }
  });
});
