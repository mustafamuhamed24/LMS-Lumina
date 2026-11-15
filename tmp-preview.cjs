const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });
  const file = 'file:///' + path.resolve('docs/Lumina-LMS-Platform-Guide.pdf').replace(/\\/g, '/');
  await page.goto(file);
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'docs/preview.png' });
  console.log('shot taken', await page.title());
  await browser.close();
})();
