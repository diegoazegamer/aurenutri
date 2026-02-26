const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const originalLogs = [];
  page.on('console', msg => originalLogs.push(msg.text()));
  page.on('pageerror', exception => originalLogs.push(`Uncaught exception: "${exception}"`));

  await page.goto('https://aurenutri.vercel.app', { waitUntil: 'networkidle' });
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("--- BROWSER LOGS LOCAL ---");
  originalLogs.forEach(l => console.log(l));
  
  // also print inner hook
  const body = await page.innerHTML('body');
  console.log(body.substring(0, 200));
  
  await browser.close();
})();
