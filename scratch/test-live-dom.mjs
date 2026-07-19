import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log("Navigating to live site...");
    await page.goto('https://alphadentkart-001.web.app/', { waitUntil: 'networkidle' });
    
    // Accept cookies if visible
    const acceptCookies = page.locator('text="Accept"').first();
    if (await acceptCookies.isVisible()) {
      await acceptCookies.click();
    }
    
    // Go to Shop
    await page.locator('text="Shop"').first().click();
    await page.waitForTimeout(2000);
    
    // Go to first product
    await page.locator('.grid img').first().click();
    await page.waitForTimeout(2000);
    
    // Get HTML of the main image column
    const html = await page.locator('.lg\\:sticky').first().innerHTML();
    console.log("================ STICKY COLUMN HTML ================");
    console.log(html);
    console.log("====================================================");
    
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
}

run();
