import { chromium } from 'playwright';
import path from 'path';

async function run() {
  console.log("Starting verification with Playwright...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set viewport to a standard desktop size
  await page.setViewportSize({ width: 1280, height: 800 });
  
  try {
    console.log("1. Navigating to live site: https://alphadentkart-001.web.app/");
    await page.goto('https://alphadentkart-001.web.app/', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Accept cookies if visible
    const acceptCookies = page.locator('text="Accept"').first();
    if (await acceptCookies.isVisible()) {
      console.log("Accepting cookies...");
      await acceptCookies.click();
    }
    
    console.log("Taking screenshot of homepage...");
    await page.screenshot({ path: 'scratch/site-loaded.png' });
    
    // Go to Shop
    console.log("2. Navigating to Shop...");
    await page.locator('text="Shop"').first().click();
    await page.waitForTimeout(3000);
    
    console.log("Taking screenshot of Shop page...");
    await page.screenshot({ path: 'scratch/site-shop.png' });
    
    // Go to first product
    console.log("3. Clicking the first product...");
    await page.locator('.grid img').first().click();
    await page.waitForTimeout(3000);
    
    console.log("Taking screenshot of Product Detail page...");
    await page.screenshot({ path: 'scratch/product-detail.png' });
    
    // Get HTML of the main image column to verify elements
    const html = await page.locator('.lg\\:sticky').first().innerHTML();
    console.log("================ STICKY COLUMN HTML ================");
    console.log(html.substring(0, 1000) + (html.length > 1000 ? "..." : ""));
    console.log("====================================================");
    
    // Click the main product image to trigger lightbox
    console.log("4. Attempting to click main product image for lightbox...");
    const mainImage = page.locator('.lg\\:sticky img').first();
    if (await mainImage.isVisible()) {
      await mainImage.click();
      await page.waitForTimeout(2000);
      console.log("Taking screenshot of Lightbox Modal...");
      await page.screenshot({ path: 'scratch/lightbox-open.png' });
    } else {
      console.log("Main image not visible or not found under sticky column!");
    }
    
    console.log("Verification finished successfully!");
  } catch (err) {
    console.error("An error occurred during verification:", err);
  } finally {
    await browser.close();
  }
}

run();
