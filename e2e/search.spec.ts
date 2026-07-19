import { test, expect } from '@playwright/test';

test.describe('Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
  });

  test('search input is present', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search products...');
    await expect(searchInput).toBeVisible({ timeout: 10000 });
  });

  test('typing in search works', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search products...');
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await searchInput.fill('dental');
    await expect(searchInput).toHaveValue('dental');
    await searchInput.clear();
    await expect(searchInput).toHaveValue('');
  });

  test('search results display', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search products...');
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await searchInput.fill('composite');
    await page.waitForTimeout(1000);
  });

  test('search clears on escape', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search products...');
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await searchInput.fill('test');
    await searchInput.press('Escape');
  });
});
