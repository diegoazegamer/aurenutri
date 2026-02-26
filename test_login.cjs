const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto('https://aurenutri.vercel.app', { waitUntil: 'networkidle' });

    await page.waitForTimeout(2000);

    await page.fill('input[placeholder="exemplo@email.com"]', 'aurenisavitelli@gmail.com');
    await page.fill('input[placeholder="••••••••"]', 'aure@2026');

    await page.click('text=Entrar no Aplicativo');

    await page.waitForTimeout(2000);

    // See if there's any text indicating dashboard
    const content = await page.innerText('body');
    if (content.includes('Total Pacientes') || content.includes('Dra. Aure')) {
        console.log("LOGIN SUCCESSFUL");
    } else {
        console.log("LOGIN FAILED or Dashboard not found.");
        console.log("Content start:", content.substring(0, 100));
    }

    await browser.close();
})();
