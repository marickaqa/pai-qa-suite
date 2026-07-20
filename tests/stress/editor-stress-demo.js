const { chromium } = require('playwright');

const EDITOR_URL = 'https://subtitles-dev.paicloud.ai/jobs/41de6834-c476-4c57-b4a0-8fbdbfe69599/edit/English';
const N = 10;

async function simulateUser(userId) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: 'reports/subtitles-session.json' });
  const page = await context.newPage();
  page.setDefaultTimeout(180000);
  const start = Date.now();
  try {
    await new Promise(r => setTimeout(r, Math.random() * 10000));
    await page.goto(EDITOR_URL, { timeout: 180000 });
    await page.waitForTimeout(3000);
    await page.locator('button[aria-label="Play"]').first().click();
    await page.waitForTimeout(2000);
    const captions = page.locator('textarea, [contenteditable="true"]');
    const count = await captions.count();
    const idx = userId % count;
    await captions.nth(idx).click();
    await captions.nth(idx).fill('User ' + userId + ' edited at ' + Date.now());
    await page.getByRole('button', { name: /save/i }).first().click()
    await page.getByText('Overwrite').click();
    await page.waitForTimeout(1000);
    console.log('OK User ' + userId + ' completed in ' + Math.round((Date.now() - start)/1000) + 's');
    return { success: true, time: Date.now() - start };
  } catch(e) {
    console.log('FAIL User ' + userId + ' FAILED: ' + e.message.substring(0, 60));
    return { success: false, error: e.message };
  } finally {
    await context.close();
    await browser.close();
  }
}

(async () => {
  console.log('Starting ' + N + ' concurrent users...');
  const start = Date.now();
  const results = await Promise.all(Array.from({length: N}, (_, i) => simulateUser(i)));
  const succeeded = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  console.log('');
  console.log('--- RESULTS ---');
  console.log(succeeded.length + '/' + N + ' succeeded');
  console.log('Failures: ' + failed.length);
  console.log('Total time: ' + Math.round((Date.now() - start)/1000) + 's');
})();






