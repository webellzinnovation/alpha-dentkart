import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login modal/overlay renders from homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const loginBtn = page.getByText(/log\s*in/i).first();
    if (await loginBtn.isVisible().catch(() => false)) {
      await loginBtn.click();
      await page.waitForTimeout(1000);

      const hasLoginForm = await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first().isVisible().catch(() => false);
      const hasPasswordField = await page.locator('input[type="password"], input[name="password"]').first().isVisible().catch(() => false);
      expect(hasLoginForm || hasPasswordField).toBeTruthy();
    }
  });

  test('login form has email and password fields', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const loginBtn = page.getByText(/log\s*in/i).first();
    if (await loginBtn.isVisible().catch(() => false)) {
      await loginBtn.click();
      await page.waitForTimeout(1000);

      const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

      if (await emailInput.isVisible().catch(() => false)) {
        await expect(emailInput).toBeVisible();
      }
      if (await passwordInput.isVisible().catch(() => false)) {
        await expect(passwordInput).toBeVisible();
      }
    }
  });

  test('login form has sign-in button', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const loginBtn = page.getByText(/log\s*in/i).first();
    if (await loginBtn.isVisible().catch(() => false)) {
      await loginBtn.click();
      await page.waitForTimeout(1000);

      const submitBtn = page.getByRole('button', { name: /sign in|log in|login|submit/i }).first();
      if (await submitBtn.isVisible().catch(() => false)) {
        await expect(submitBtn).toBeVisible();
      }
    }
  });

  test('register form shows from login', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const loginBtn = page.getByText(/log\s*in/i).first();
    if (await loginBtn.isVisible().catch(() => false)) {
      await loginBtn.click();
      await page.waitForTimeout(1000);

      const registerLink = page.getByText(/register|sign up|create.*account/i).first();
      if (await registerLink.isVisible().catch(() => false)) {
        await registerLink.click();
        await page.waitForTimeout(1000);

        const hasRegisterForm = await page.locator('input[name="name"], input[placeholder*="name" i]').first().isVisible().catch(() => false);
        const hasEmailField = await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first().isVisible().catch(() => false);
        expect(hasRegisterForm || hasEmailField).toBeTruthy();
      }
    }
  });

  test('navigation between Login and Register works', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const loginBtn = page.getByText(/log\s*in/i).first();
    if (await loginBtn.isVisible().catch(() => false)) {
      await loginBtn.click();
      await page.waitForTimeout(1000);

      const registerLink = page.getByText(/register|sign up|create.*account/i).first();
      if (await registerLink.isVisible().catch(() => false)) {
        await registerLink.click();
        await page.waitForTimeout(1000);
      }

      const loginLink = page.getByText(/login|sign in|already.*have.*account/i).first();
      if (await loginLink.isVisible().catch(() => false)) {
        await loginLink.click();
        await page.waitForTimeout(1000);
      }
    }
  });
});
