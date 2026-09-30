// Use the disposable fixture from WEDEZ_KEEP_TEST_SERVER=1 bun scripts/test-affiliate.mjs
// and a web dev server on port 5190 pointing at that fixture. No real payout data is used.
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const appUrl = process.env.WEDEZ_TEST_WEB_URL || 'http://127.0.0.1:5190';
const apiUrl = process.env.WEDEZ_TEST_API_URL || 'http://127.0.0.1:8190';
assert.equal(new URL(appUrl).hostname, '127.0.0.1');
assert.equal(new URL(apiUrl).hostname, '127.0.0.1');
assert.notEqual(new URL(apiUrl).port, '8090');
const screenshots = await mkdtemp(path.join(tmpdir(), 'wedez-affiliate-proof-'));
const browser = await chromium.launch({
	headless: true,
	executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));

try {
	await page.goto(appUrl + '/login?next=%2Faffiliate%2Fpayouts');
	await page.getByLabel('Email', { exact: true }).fill('affiliate@example.test');
	await page.getByLabel('Kata sandi', { exact: true }).fill('Affiliate-Test-Only-9876');
	const listResponse = page.waitForResponse((response) =>
		response.url().startsWith(apiUrl + '/api/collections/affiliate_payouts/records?')
	);
	await page.getByRole('button', { name: 'Masuk', exact: true }).click();
	await page.waitForURL('**/affiliate/payouts');
	const payouts = (await (await listResponse).json()).items;
	const proofButtons = page.getByRole('button', { name: 'Lihat bukti transfer', exact: true });
	await proofButtons.first().waitFor();
	assert.equal(
		await proofButtons.count(),
		payouts.filter((payout) => payout.transfer_proof).length
	);
	assert.ok(payouts.some((payout) => !payout.transfer_proof));
	console.log('PASS only payouts with attachments show the proof action');

	const button = proofButtons.first();
	const dialog = page.getByRole('dialog', { name: 'Bukti transfer', exact: true });
	const image = dialog.getByAltText('Bukti transfer pencairan affiliate', { exact: true });
	const response = page.waitForResponse(
		(response) => response.url().includes('/api/files/') && response.url().includes('?token=')
	);
	await button.click();
	assert.equal((await response).status(), 200);
	await image.waitFor({ state: 'visible' });
	assert.ok(await image.evaluate((element) => element.complete && element.naturalWidth > 0));
	assert.ok((await image.getAttribute('src')).includes('token='));
	await page.screenshot({ path: path.join(screenshots, 'proof-desktop.png') });
	await page.keyboard.press('Escape');
	await dialog.waitFor({ state: 'hidden' });
	assert.ok(await button.evaluate((element) => element === document.activeElement));
	console.log('PASS protected image loads using affiliate credentials; Escape restores focus');

	await page.setViewportSize({ width: 390, height: 844 });
	await button.click();
	await image.waitFor({ state: 'visible' });
	const bounds = await dialog.boundingBox();
	assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 390);
	await page.screenshot({ path: path.join(screenshots, 'proof-mobile.png') });
	await dialog.getByRole('button', { name: 'Tutup', exact: true }).click();
	await dialog.waitFor({ state: 'hidden' });
	console.log('PASS proof dialog fits the mobile viewport and closes using its button');

	for (const routePattern of ['**/api/files/token', '**/api/files/affiliate_payouts/**']) {
		await page.route(routePattern, (route) =>
			route.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
		);
		await button.click();
		await dialog.getByRole('alert').waitFor();
		await page.unroute(routePattern);
		await dialog.getByRole('button', { name: 'Coba lagi', exact: true }).click();
		await image.waitFor({ state: 'visible' });
		await dialog.getByRole('button', { name: 'Tutup', exact: true }).click();
		await dialog.waitFor({ state: 'hidden' });
	}
	assert.deepEqual(errors, []);
	console.log('PASS failed token and image requests recover on retry; zero browser errors');
	console.log(`Screenshots: ${screenshots}`);
} finally {
	await browser.close();
}
