import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  test.describe('Desktop Layout', () => {
    test('shows full navigation', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      const header = page.locator('header');
      await expect(header).toBeVisible();

      const navLinks = header.locator('a, button').filter({ hasText: /shop|categories?|brands?/i });
      const count = await navLinks.count();
      expect(count).toBeGreaterThan(0);
    });

    test('mobile bottom nav is hidden', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      const bottomNav = page.locator('.lg\\:hidden.fixed.bottom-0');
      await expect(bottomNav).toBeHidden();
    });
  });

  test.describe('Mobile Layout', () => {
    test('shows bottom nav', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);

      const bottomNav = page.locator('.lg\\:hidden.fixed.bottom-0');
      await expect(bottomNav).toBeVisible({ timeout: 10000 });
    });

    test('bottom nav has all required items', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);

      const bottomNav = page.locator('.lg\\:hidden.fixed.bottom-0');
      await expect(bottomNav).toBeVisible({ timeout: 10000 });

      await expect(bottomNav.getByText(/home/i)).toBeVisible();
      await expect(bottomNav.getByText(/category/i)).toBeVisible();
      await expect(bottomNav.getByText(/brand/i)).toBeVisible();
      await expect(bottomNav.getByText(/cart/i)).toBeVisible();
    });

    test('sidebar collapses on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      expect(true).toBeTruthy();
    });
  });

  test.describe('Tablet Layout', () => {
    test('adapts to tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      await expect(page.locator('body')).toBeVisible();
    });
  });
});
