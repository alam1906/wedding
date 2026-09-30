// Requires the disposable fixture from WEDEZ_KEEP_TEST_SERVER=1 bun scripts/test-affiliate.mjs.
// Uses an existing Playwright installation and never the development/production database.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHmac } from 'node:crypto';
import { once } from 'node:events';
import { mkdtemp, readFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apiUrl = process.env.WEDEZ_TEST_API_URL || 'http://127.0.0.1:8190';
assert.equal(new URL(apiUrl).hostname, '127.0.0.1');
assert.notEqual(new URL(apiUrl).port, '8090');
const appPort = 5195;
const appUrl = `http://127.0.0.1:${appPort}`;
const password = 'Affiliate-Test-Only-9876';
const adminEmail = 'affiliate-admin@example.test';
const screenshots = await mkdtemp(path.join(tmpdir(), 'wedez-admin-payout-browser-'));
const image = await readFile(path.join(root, 'apps/admin/static/logo-wedez.webp'));
const imageFile = { name: 'bukti-transfer.webp', mimeType: 'image/webp', buffer: image };
let admin = '';
let browser;
let app;
let logs = '';
const errors = [];

async function api(route, { token = admin, method = 'GET', body } = {}) {
	const response = await fetch(apiUrl + route, {
		method,
		headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: token } : {}) },
		body: body === undefined ? undefined : JSON.stringify(body)
	});
	const data = await response.json();
	assert.ok(response.ok, `${route}: ${JSON.stringify(data)}`);
	return data;
}

try {
	admin = (
		await api('/api/collections/_superusers/auth-with-password', {
			token: '',
			method: 'POST',
			body: { identity: adminEmail, password }
		})
	).token;
	// The API suite already checked throttling; browser fixtures create additional mock sales.
	const settings = await api('/api/settings');
	await api('/api/settings', {
		method: 'PATCH',
		body: {
			rateLimits: {
				...settings.rateLimits,
				rules: settings.rateLimits.rules.map((rule) => ({ ...rule, maxRequests: 1000 }))
			}
		}
	});
	const affiliateUser = await api('/api/collections/users/auth-with-password', {
		token: '',
		method: 'POST',
		body: { identity: 'affiliate@example.test', password }
	});
	const affiliate = (await api('/api/wedez/affiliate/me', { token: affiliateUser.token }))
		.affiliate;
	const suffix = Date.now();
	// Earn real test commissions via the mocked gateway rather than directly editing the ledger.
	for (let index = 0; index < 6; index++) {
		const email = `admin-proof-${suffix}-${index}@example.test`;
		const user = await api('/api/collections/users/records', {
			token: '',
			method: 'POST',
			body: { email, password, passwordConfirm: password, name: 'Proof Test Buyer' }
		});
		await api(`/api/collections/users/records/${user.id}`, {
			method: 'PATCH',
			body: { verified: true }
		});
		const auth = await api('/api/collections/users/auth-with-password', {
			token: '',
			method: 'POST',
			body: { identity: email, password }
		});
		await api('/api/wedez/account/provision', { token: auth.token, method: 'POST' });
		const { payment } = await api('/api/wedez/payments/session', {
			token: auth.token,
			method: 'POST',
			body: { couponCode: affiliate.code }
		});
		const record = await api(`/api/collections/payments/records/${payment.id}`);
		await api('/api/wedez/payments/duitku/callback', {
			token: '',
			method: 'POST',
			body: {
				merchantCode: 'TEST',
				merchantOrderId: record.provider_transaction_id,
				amount: String(payment.amount),
				resultCode: '00',
				reference: `ref-${record.provider_transaction_id}`,
				signature: createHmac('sha256', 'fake-duitku-test-key')
					.update('TEST' + payment.amount + record.provider_transaction_id)
					.digest('hex')
			}
		});
	}
	const payout = await api('/api/wedez/affiliate/payouts', {
		token: affiliateUser.token,
		method: 'POST'
	});
	assert.equal(payout.status, 'requested');

	const probe = createServer();
	probe.listen(appPort, '127.0.0.1');
	await once(probe, 'listening');
	await new Promise((resolve) => probe.close(resolve));
	app = spawn(
		'bun',
		['run', 'dev', '--host', '127.0.0.1', '--port', String(appPort), '--strictPort'],
		{
			cwd: path.join(root, 'apps/admin'),
			env: { ...process.env, PUBLIC_POCKETBASE_URL: apiUrl },
			stdio: ['ignore', 'pipe', 'pipe']
		}
	);
	app.stdout.on('data', (data) => {
		logs += data;
	});
	app.stderr.on('data', (data) => {
		logs += data;
	});
	let ready = false;
	for (let attempt = 0; attempt < 100; attempt++) {
		if (app.exitCode !== null) throw new Error(logs);
		try {
			if ((await fetch(appUrl)).ok) {
				ready = true;
				break;
			}
		} catch {
			/* wait for the test frontend */
		}
		await new Promise((resolve) => setTimeout(resolve, 100));
	}
	assert.ok(ready, logs);
	browser = await chromium.launch({
		headless: true,
		executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
	});
	const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
	page.on('pageerror', (error) => errors.push(error.message));
	await page.goto(appUrl);
	await page.getByLabel('Email', { exact: true }).fill(adminEmail);
	await page.getByLabel('Kata sandi', { exact: true }).fill(password);
	await page.getByRole('button', { name: 'Masuk', exact: true }).click();
	await page.getByRole('button', { name: 'Pencairan', exact: true }).click();
	await page.getByRole('button', { name: 'Proses', exact: true }).first().click();
	let dialog = page.getByRole('dialog', { name: 'Konfirmasi pencairan' });
	await dialog.getByRole('button', { name: 'Simpan status', exact: true }).click();
	await dialog.waitFor({ state: 'hidden' });
	await page.getByRole('button', { name: 'Tandai dibayar', exact: true }).first().click();
	dialog = page.getByRole('dialog', { name: 'Konfirmasi pencairan' });
	await dialog.getByLabel('Referensi transfer', { exact: true }).fill(`test-bank-${suffix}`);
	const input = dialog.getByLabel('Bukti transfer', { exact: true });
	await dialog.getByRole('button', { name: 'Simpan status', exact: true }).click();
	assert.equal(await input.evaluate((element) => element.validity.valueMissing), true);
	assert.equal(
		(await api(`/api/collections/affiliate_payouts/records/${payout.id}`)).status,
		'processing'
	);
	await input.setInputFiles({
		name: 'bukti.svg',
		mimeType: 'image/svg+xml',
		buffer: Buffer.from('<svg/>')
	});
	await dialog.getByText('Gunakan gambar JPG, PNG, atau WebP.', { exact: true }).waitFor();
	assert.equal(await input.evaluate((element) => element.files.length), 0);
	await input.setInputFiles({
		name: 'besar.png',
		mimeType: 'image/png',
		buffer: Buffer.alloc(5 * 1024 * 1024 + 1)
	});
	await dialog.getByText('Ukuran gambar maksimal 5 MB.', { exact: true }).waitFor();
	await input.setInputFiles(imageFile);
	const preview = dialog.getByAltText('Pratinjau bukti transfer', { exact: true });
	await preview.waitFor();
	assert.ok(await preview.evaluate((element) => element.complete && element.naturalWidth > 0));
	await page.screenshot({ path: path.join(screenshots, 'upload-desktop.png') });
	await dialog.getByRole('button', { name: 'Hapus gambar', exact: true }).click();
	assert.equal(await preview.count(), 0);
	await input.setInputFiles(imageFile);
	await dialog.getByRole('button', { name: 'Batal', exact: true }).click();
	await dialog.waitFor({ state: 'hidden' });
	await page.getByRole('button', { name: 'Tandai dibayar', exact: true }).first().click();
	dialog = page.getByRole('dialog', { name: 'Konfirmasi pencairan' });
	assert.equal(
		await dialog
			.getByLabel('Bukti transfer', { exact: true })
			.evaluate((element) => element.files.length),
		0
	);
	assert.equal(await dialog.getByAltText('Pratinjau bukti transfer', { exact: true }).count(), 0);
	console.log('PASS required image, format/size validation, preview, removal and cancel reset');

	await page.setViewportSize({ width: 390, height: 844 });
	await dialog.getByLabel('Referensi transfer', { exact: true }).fill(`test-bank-${suffix}`);
	await dialog.getByLabel('Bukti transfer', { exact: true }).setInputFiles(imageFile);
	await dialog.getByAltText('Pratinjau bukti transfer', { exact: true }).waitFor();
	assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
	const bounds = await dialog.boundingBox();
	assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 390);
	await page.screenshot({ path: path.join(screenshots, 'upload-mobile.png') });
	await dialog.getByRole('button', { name: 'Simpan status', exact: true }).click();
	await dialog.waitFor({ state: 'hidden' });
	const saved = await api(`/api/collections/affiliate_payouts/records/${payout.id}`);
	assert.equal(saved.status, 'paid');
	assert.equal(saved.transfer_reference, `test-bank-${suffix}`);
	assert.ok(saved.transfer_proof.endsWith('.webp'));
	assert.ok(saved.paid_at);
	console.log('PASS mobile upload and admin SDK persist proof with paid status');

	for (const width of [1366, 390]) {
		await page.setViewportSize({ width, height: 900 });
		const action = page.getByRole('button', { name: 'Lihat bukti', exact: true }).first();
		const metrics = await action.evaluate((button) => {
			const label = button.parentElement.querySelector('span');
			const buttonRect = button.getBoundingClientRect();
			const labelRect = label.getBoundingClientRect();
			return {
				buttonHeight: buttonRect.height,
				labelHeight: labelRect.height,
				centerDifference: Math.abs(
					buttonRect.y + buttonRect.height / 2 - labelRect.y - labelRect.height / 2
				),
				gap: buttonRect.x - labelRect.right
			};
		});
		assert.equal(metrics.buttonHeight, 32);
		assert.equal(metrics.labelHeight, 32);
		assert.ok(metrics.centerDifference < 1);
		assert.equal(metrics.gap, 12);
		await action.locator('..').screenshot({ path: path.join(screenshots, `actions-${width}.png`) });
	}
	console.log(
		'PASS payout action alignment: centered, 32px height and 12px gap at desktop/mobile widths'
	);

	await page.getByRole('button', { name: 'Lihat bukti', exact: true }).first().click();
	const proof = page.getByRole('dialog', { name: 'Bukti transfer', exact: true });
	const proofPreview = proof.getByAltText('Bukti transfer pencairan affiliate', { exact: true });
	await proofPreview.waitFor();
	await page.waitForFunction(() => {
		const image = document.querySelector('dialog[open] img');
		return image?.complete && image.naturalWidth > 0;
	});
	assert.ok(await proofPreview.getAttribute('src').then((url) => url.includes('token=')));
	await page.screenshot({ path: path.join(screenshots, 'proof-mobile.png') });
	await page.keyboard.press('Escape');
	await proof.waitFor({ state: 'hidden' });
	assert.deepEqual(errors, []);
	console.log(
		`PASS protected proof preview, Escape dismissal and zero browser errors. Screenshots: ${screenshots}`
	);
} finally {
	await browser?.close();
	if (app && app.exitCode === null) {
		const stopped = once(app, 'exit');
		app.kill('SIGTERM');
		await stopped;
	}
}
