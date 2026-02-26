const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto('https://aurenutri.vercel.app', { waitUntil: 'networkidle' });

    // Wait for React to mount
    await page.waitForTimeout(2000);

    // Click Cadastre-se
    try {
        await page.click('text=Cadastre-se');
    } catch (e) { console.log(e.message); }

    await page.waitForTimeout(500);

    // Fill the form. App.tsx has inputs for Nome, Email, WhatsApp, Senha
    await page.fill('input[type="text"]:not([placeholder*="WhatsApp"])', 'Dra. Aurenis');
    await page.fill('input[type="email"]', 'aurenisavitelli@gmail.com');
    await page.fill('input[type="text"][placeholder*="WhatsApp"]', '11999999999');
    await page.fill('input[type="password"]', 'aure@2026');

    // Submit
    await page.click('text=Criar minha Conta');

    // Wait for success or error
    page.on('console', msg => console.log('LOG:', msg.text()));

    await page.waitForTimeout(4000);
    console.log("Registered!");

    await browser.close();
})();
