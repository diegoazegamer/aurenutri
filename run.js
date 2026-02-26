const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', exception => {
    console.log(`Uncaught exception: "${exception}"`);
  });

  console.log('Navigating to Vercel URL...');
  const response = await page.goto('https://aurenutri.vercel.app');
  console.log('Loaded with status:', response?.status());
  
  await new Promise(r => setTimeout(r, 6000));
  await browser.close();
})();
