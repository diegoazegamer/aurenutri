const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto('https://aurenutri.vercel.app', { waitUntil: 'networkidle' });

    // Wait for React to mount
    await page.waitForTimeout(2000);

    // Click Cadastre-se
    try {
        await page.click('text=Cadastre-se', { timeout: 5000 });
    } catch (e) { console.log("Did not find Cadastre-se, might already be on it"); }

    await page.waitForTimeout(500);

    // Fill the form using precise placeholders
    await page.fill('input[placeholder="Seu nome"]', 'Dra. Aurenis');
    await page.fill('input[placeholder="(00) 00000-0000"]', '11999999999');
    await page.fill('input[placeholder="exemplo@email.com"]', 'aurenisavitelli@gmail.com');
    await page.fill('input[placeholder="••••••••"]', 'aure@2026');

    // Submit
    await page.click('text=Criar minha Conta');

    // Wait for success or error
    page.on('console', msg => console.log('LOG:', msg.text()));

    await page.waitForTimeout(4000);

    // Check what page we are on or if there's an error
    const bodyText = await page.innerText('body');
    if (bodyText.includes('Processando')) {
        await page.waitForTimeout(3000);
    }
    console.log("Registered? Check logs.");

    await browser.close();
})();
