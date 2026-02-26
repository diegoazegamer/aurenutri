const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const originalLogs = [];
  page.on('console', msg => originalLogs.push(msg.text()));
  page.on('pageerror', exception => originalLogs.push(`Uncaught exception: "${exception}"`));
  page.on('requestfailed', request => originalLogs.push(`Request failed: ${request.url()} - ${request.failure().errorText}`));

  await page.goto('https://aurenutri.vercel.app', { waitUntil: 'networkidle' });
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("--- BROWSER LOGS ---");
  originalLogs.forEach(l => console.log(l));
  
  await browser.close();
})();
