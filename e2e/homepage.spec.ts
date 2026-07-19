import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('page loads successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/alpha|dentkart|dental/i);
    await expect(page.locator('body')).toBeVisible();
  });

  test('hero section is visible', async ({ page }) => {
    const hero = page.locator('main').first();
    await expect(hero).toBeVisible();
    await expect(page.getByText('Shop Now').first()).toBeVisible();
  });

  test('navigation header is present', async ({ page }) => {
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('product grid displays products', async ({ page }) => {
    const firstCard = page.locator('.premium-card').first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    const count = await page.locator('.premium-card').count();
    expect(count).toBeGreaterThan(0);
  });

  test('footer is visible with correct content', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer.getByText(/Contact Us/i)).toBeVisible();
    await expect(footer.getByText(/Information/i)).toBeVisible();
    await expect(footer.getByText(/Account/i)).toBeVisible();
    await expect(footer.getByText(/Top Brands/i)).toBeVisible();
    await expect(footer.getByText(/sales@alphadentkart\.com/i)).toBeVisible();
  });

  test('mobile bottom nav is hidden on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    const bottomNav = page.locator('button').filter({ hasText: /^home$/i }).first();
    await expect(bottomNav).toBeHidden();
  });
});
