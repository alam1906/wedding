// Run against the isolated fixture from WEDEZ_KEEP_TEST_SERVER=1 bun scripts/test-affiliate.mjs.
// Uses an existing Playwright installation; no dependency is added to the app.
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const appUrl = process.env.WEDEZ_TEST_WEB_URL || 'http://127.0.0.1:5190';
const apiUrl = process.env.WEDEZ_TEST_API_URL || 'http://127.0.0.1:8190';
assert.equal(new URL(appUrl).hostname, '127.0.0.1');
assert.equal(new URL(apiUrl).hostname, '127.0.0.1');
const password = 'Affiliate-Test-Only-9876';
const shots = await mkdtemp(path.join(tmpdir(), 'wedez-affiliate-browser-'));
async function api(route, method = 'GET', body, token = admin) {
	const response = await fetch(apiUrl + route, {
		method,
		headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: token } : {}) },
		body: body === undefined ? undefined : JSON.stringify(body)
	});
	const result = await response.json();
	assert.ok(response.ok, JSON.stringify(result));
	return result;
}
const admin = (
	await api(
		'/api/collections/_superusers/auth-with-password',
		'POST',
		{ identity: 'affiliate-admin@example.test', password },
		''
	)
).token;
const browser = await chromium.launch({
	headless: true,
	executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
});
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const suffix = Date.now();
const email = `browser-affiliate-${suffix}@example.test`;
try {
	await page.goto(appUrl + '/affiliate');
	await page.waitForURL('**/register?**');
	await page.waitForLoadState('networkidle');
	await page.getByLabel('Nama', { exact: true }).fill('Affiliate Browser');
	await page.getByLabel('Email', { exact: true }).fill(email);
	await page.getByLabel('Kata sandi', { exact: true }).fill(password);
	await page.getByLabel('Konfirmasi kata sandi', { exact: true }).fill(password);
	await page.getByRole('button', { name: 'Daftar', exact: true }).click();
	await page.waitForURL('**/login?**');
	const user = (
		await api('/api/collections/users/records?filter=' + encodeURIComponent(`email = '${email}'`))
	).items[0];
	assert.ok(!('signup_intent' in user));
	assert.equal(user.home_area, '');
	assert.ok(!user.wedding_id);
	await api(`/api/collections/users/records/${user.id}`, 'PATCH', { verified: true });
	await page.getByLabel('Email', { exact: true }).fill(email);
	await page.getByLabel('Kata sandi', { exact: true }).fill(password);
	await page.getByRole('button', { name: 'Masuk', exact: true }).click();
	await page.waitForURL('**/start');
	await page.getByRole('button', { name: 'Masuk ke affiliate', exact: true }).click();
	await page.waitForURL('**/affiliate/dashboard');
	assert.equal((await api(`/api/collections/users/records/${user.id}`)).home_area, 'affiliate');
	await page.getByRole('button', { name: 'Ajukan pendaftaran affiliate', exact: true }).click();
	await page.getByText('Menunggu persetujuan', { exact: true }).first().waitFor();
	const sidebar = await page.locator('aside.sidebar').boundingBox();
	const topbar = await page.locator('header').boundingBox();
	assert.equal(Math.round(sidebar?.width ?? 0), 230);
	assert.equal(Math.round(topbar?.x ?? 0), 230);
	assert.equal(await page.getByRole('link', { name: 'Data Pernikahan', exact: true }).count(), 0);
	assert.equal(await page.getByRole('link', { name: 'Undangan', exact: true }).count(), 0);
	await page.screenshot({
		path: path.join(shots, 'affiliate-pending-desktop.png'),
		fullPage: true
	});
	await page.goto(appUrl + '/user/dashboard');
	await page.waitForLoadState('networkidle');
	await page.waitForURL('**/affiliate/dashboard');
	const affiliate = (
		await api(
			'/api/collections/affiliates/records?filter=' + encodeURIComponent(`user = '${user.id}'`)
		)
	).items[0];
	await api(`/api/collections/affiliates/records/${affiliate.id}`, 'PATCH', { status: 'active' });
	await page.setViewportSize({ width: 390, height: 844 });
	await page.getByRole('button', { name: 'Buka menu', exact: true }).click();
	await page.getByRole('link', { name: 'Rekening', exact: true }).click();
	assert.equal(
		await page
			.getByRole('button', { name: 'Buka menu', exact: true })
			.getAttribute('aria-expanded'),
		'false'
	);
	await page.getByLabel('Nama bank', { exact: true }).fill('BCA');
	await page.getByLabel('Nomor rekening', { exact: true }).fill('0012345678');
	await page.getByLabel('Nama pemilik rekening', { exact: true }).fill('Affiliate Browser');
	await page.getByRole('button', { name: 'Simpan rekening', exact: true }).click();
	await page.getByText('Rekening pencairan disimpan.', { exact: true }).waitFor();
	await page.getByRole('button', { name: 'Buka menu', exact: true }).click();
	await page.getByRole('link', { name: 'Pencairan', exact: true }).click();
	assert.equal(
		await page.getByRole('button', { name: 'Ajukan pencairan', exact: true }).isDisabled(),
		true
	);
	await page.getByRole('button', { name: 'Buka menu', exact: true }).click();
	await page.getByRole('link', { name: 'Beranda', exact: true }).click();
	await page.waitForURL('**/affiliate/dashboard');
	await page.getByRole('heading', { name: 'Ringkasan affiliate', exact: true }).waitFor();
	await page
		.getByText('Rekening pencairan disimpan.', { exact: true })
		.waitFor({ state: 'hidden' });
	await page.screenshot({ path: path.join(shots, 'affiliate-active-mobile.png'), fullPage: true });
	assert.equal(
		await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
		false
	);
	await page.getByRole('button', { name: 'Buka menu profil', exact: true }).click();
	assert.equal(await page.getByRole('menuitem', { name: 'Ubah tujuan masuk' }).count(), 0);
	assert.equal(
		await page.getByRole('menuitem', { name: 'Beralih ke Undangan', exact: true }).count(),
		0
	);
	await page.getByRole('menuitem', { name: 'Keluar', exact: true }).click();
	await page.waitForURL('**/login');
	await page.getByLabel('Email', { exact: true }).fill(email);
	await page.getByLabel('Kata sandi', { exact: true }).fill(password);
	await page.getByRole('button', { name: 'Masuk', exact: true }).click();
	await page.waitForURL('**/affiliate/dashboard');
	await page.getByRole('button', { name: 'Buka menu profil', exact: true }).click();
	await page.getByRole('menuitem', { name: 'Keluar', exact: true }).click();
	await page.waitForURL('**/login');
	console.log(
		'PASS affiliate choice persists across login, enrollment, bank form and mobile layout'
	);

	const weddingEmail = `browser-wedding-${suffix}@example.test`;
	const weddingStarter = await api('/api/collections/users/records', 'POST', {
		email: weddingEmail,
		password,
		passwordConfirm: password,
		name: 'Wedding Starter'
	});
	await api(`/api/collections/users/records/${weddingStarter.id}`, 'PATCH', { verified: true });
	await page.goto(appUrl + '/login?next=/upgrade');
	await page.waitForLoadState('networkidle');
	await page.getByLabel('Email', { exact: true }).fill(weddingEmail);
	await page.getByLabel('Kata sandi', { exact: true }).fill(password);
	await page.getByRole('button', { name: 'Masuk', exact: true }).click();
	await page.waitForURL('**/start');
	await page.getByRole('button', { name: 'Buat undangan gratis', exact: true }).click();
	await page.waitForURL('**/user/dashboard');
	const chosenWedding = await api(`/api/collections/users/records/${weddingStarter.id}`);
	assert.equal(chosenWedding.home_area, 'wedding');
	assert.ok(chosenWedding.wedding_id);
	await page.getByRole('button', { name: 'Buka menu profil', exact: true }).click();
	await page.getByRole('menuitem', { name: 'Keluar', exact: true }).click();
	await page.waitForURL('**/login');
	await page.getByLabel('Email', { exact: true }).fill(weddingEmail);
	await page.getByLabel('Kata sandi', { exact: true }).fill(password);
	await page.getByRole('button', { name: 'Masuk', exact: true }).click();
	await page.waitForURL('**/user/dashboard');
	await page.getByRole('button', { name: 'Buka menu profil', exact: true }).click();
	assert.equal(await page.getByRole('menuitem', { name: 'Ubah tujuan masuk' }).count(), 0);
	await page.getByRole('menuitem', { name: 'Gabung Affiliate', exact: true }).click();
	await page.waitForURL('**/affiliate/dashboard');
	assert.equal(
		(await api(`/api/collections/users/records/${weddingStarter.id}`)).home_area,
		'affiliate'
	);
	await page.getByRole('button', { name: 'Buka menu profil', exact: true }).click();
	await page.getByRole('menuitem', { name: 'Keluar', exact: true }).click();
	await page.waitForURL('**/login');
	await page.getByLabel('Email', { exact: true }).fill(weddingEmail);
	await page.getByLabel('Kata sandi', { exact: true }).fill(password);
	await page.getByRole('button', { name: 'Masuk', exact: true }).click();
	await page.waitForURL('**/affiliate/dashboard');
	await page.getByRole('button', { name: 'Buka menu profil', exact: true }).click();
	await page.getByRole('menuitem', { name: 'Keluar', exact: true }).click();
	await page.waitForURL('**/login');
	await page.goto(appUrl + '/login');
	await page.waitForLoadState('networkidle');
	console.log('PASS wedding choice and Gabung Affiliate persist across login');

	await page.getByLabel('Email', { exact: true }).fill('affiliate@example.test');
	await page.getByLabel('Kata sandi', { exact: true }).fill(password);
	await page.getByRole('button', { name: 'Masuk', exact: true }).click();
	await page.waitForURL('**/affiliate/dashboard');
	await page.getByText(/Rp\s*108\.000/, { exact: true }).waitFor();
	await page.getByRole('button', { name: 'Buka menu', exact: true }).click();
	await page.getByRole('link', { name: 'Komisi', exact: true }).click();
	await page.waitForURL('**/affiliate/commissions');
	await page.locator('tbody tr').nth(11).waitFor();
	assert.equal(await page.getByText('Dibayar', { exact: true }).count(), 12);
	await page.getByRole('button', { name: 'Buka menu', exact: true }).click();
	await page.getByRole('link', { name: 'Pencairan', exact: true }).click();
	await page.getByText('test-transfer', { exact: true }).waitFor();
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.screenshot({
		path: path.join(shots, 'affiliate-payouts-desktop.png'),
		fullPage: true
	});
	await page.getByRole('button', { name: 'Buka menu profil', exact: true }).click();
	await page.getByRole('menuitem', { name: 'Beralih ke Undangan', exact: true }).click();
	await page.waitForURL('**/user/dashboard');
	const dualRole = (
		await api(
			'/api/collections/users/records?filter=' +
				encodeURIComponent("email = 'affiliate@example.test'")
		)
	).items[0];
	assert.equal((await api(`/api/collections/users/records/${dualRole.id}`)).home_area, 'wedding');
	await page.getByRole('button', { name: 'Buka menu profil', exact: true }).click();
	assert.equal(await page.getByRole('menuitem', { name: 'Ubah tujuan masuk' }).count(), 0);
	await page.getByRole('menuitem', { name: 'Beralih ke Affiliate', exact: true }).click();
	await page.waitForURL('**/affiliate/dashboard');
	assert.equal((await api(`/api/collections/users/records/${dualRole.id}`)).home_area, 'affiliate');
	await page.getByRole('button', { name: 'Buka menu profil', exact: true }).click();
	await page.getByRole('menuitem', { name: 'Keluar', exact: true }).click();
	await page.waitForURL('**/login');
	console.log('PASS paid commission history, payout history and switching between both areas');

	const retryEmail = `browser-retry-coupon-${suffix}@example.test`;
	const retryUser = await api('/api/collections/users/records', 'POST', {
		email: retryEmail,
		password,
		passwordConfirm: password,
		name: 'Retry Coupon Browser',
		verified: true
	});
	const retryAuth = await api(
		'/api/collections/users/auth-with-password',
		'POST',
		{ identity: retryEmail, password },
		''
	);
	await api('/api/wedez/account/provision', 'POST', undefined, retryAuth.token);
	await page.goto(appUrl + '/login?next=/upgrade');
	await page.waitForLoadState('networkidle');
	await page.getByLabel('Email', { exact: true }).fill(retryEmail);
	await page.getByLabel('Kata sandi', { exact: true }).fill(password);
	await page.getByRole('button', { name: 'Masuk', exact: true }).click();
	await page.waitForURL('**/upgrade');
	await page.getByRole('button', { name: 'Lanjutkan pembayaran', exact: true }).click();
	await page.getByRole('dialog', { name: 'Punya kode kupon?', exact: true }).waitFor();
	await page.getByRole('button', { name: 'Lanjut tanpa kupon', exact: true }).click();
	await page.waitForURL('**/test-checkout/**');
	const retryRecord = await api(`/api/collections/users/records/${retryUser.id}`);
	const originalInvoice = (
		await api(
			'/api/collections/payments/records?filter=' +
				encodeURIComponent(`wedding = '${retryRecord.wedding_id}'`)
		)
	).items[0];
	assert.equal(originalInvoice.amount, 50000);
	await page.goto(appUrl + '/upgrade?resultCode=02');
	await page.getByRole('heading', { name: 'Tagihan sebelumnya masih aktif' }).waitFor();
	assert.equal(await page.getByText('Pembayaran dibatalkan.', { exact: false }).count(), 0);
	await page.getByRole('button', { name: 'Punya kode kupon?', exact: true }).click();
	await page.locator('#desktop-coupon-form-code').fill(affiliate.code);
	await page.getByRole('button', { name: 'Tambahkan', exact: true }).click();
	await page.getByRole('button', { name: 'Tagihan sebelumnya masih aktif' }).waitFor();
	assert.equal(
		await page.getByRole('button', { name: 'Tagihan sebelumnya masih aktif' }).isDisabled(),
		true
	);
	await api(`/api/collections/payments/records/${originalInvoice.id}`, 'PATCH', {
		status: 'failed',
		checkout_lock: ''
	});
	await page.getByRole('button', { name: 'Periksa status tagihan' }).click();
	await page.getByRole('heading', { name: 'Tagihan sebelumnya masih aktif' }).waitFor({
		state: 'hidden'
	});
	await page.getByRole('button', { name: 'Lanjutkan pembayaran', exact: true }).click();
	await page.waitForURL('**/test-checkout/**');
	const retryInvoices = (
		await api(
			'/api/collections/payments/records?filter=' +
				encodeURIComponent(`wedding = '${retryRecord.wedding_id}'`)
		)
	).items;
	const couponInvoice = retryInvoices.find((invoice) => invoice.id !== originalInvoice.id);
	assert.equal(couponInvoice?.amount, 45000);
	assert.equal(couponInvoice?.coupon_code, affiliate.code);
	await page.goto(appUrl + '/user/dashboard');
	await page.waitForLoadState('networkidle');
	await page.getByRole('button', { name: 'Buka menu profil', exact: true }).click();
	await page.getByRole('menuitem', { name: 'Keluar', exact: true }).click();
	await page.waitForURL('**/login');
	console.log('PASS canceled no-coupon invoice can be followed by a discounted coupon invoice');

	const buyerEmail = `browser-buyer-${suffix}@example.test`;
	const buyer = await api('/api/collections/users/records', 'POST', {
		email: buyerEmail,
		password,
		passwordConfirm: password,
		name: 'Buyer Browser',
		verified: true
	});
	const buyerAuth = await api(
		'/api/collections/users/auth-with-password',
		'POST',
		{ identity: buyerEmail, password },
		''
	);
	await api('/api/wedez/account/provision', 'POST', undefined, buyerAuth.token);
	await page.goto(appUrl + '/login?next=/upgrade');
	await page.waitForLoadState('networkidle');
	await page.getByLabel('Email', { exact: true }).fill(buyerEmail);
	await page.getByLabel('Kata sandi', { exact: true }).fill(password);
	await page.getByRole('button', { name: 'Masuk', exact: true }).click();
	await page.waitForURL('**/upgrade');
	await page.getByRole('button', { name: 'Punya kode kupon?', exact: true }).click();
	await page.locator('#desktop-coupon-form-code').fill(affiliate.code.toLowerCase());
	await page.getByRole('button', { name: 'Tambahkan', exact: true }).click();
	await page.getByRole('button', { name: 'Terpasang', exact: true }).waitFor();
	await page
		.locator('main')
		.getByText(/Rp\s*45\.000/)
		.first()
		.waitFor();
	await page.screenshot({ path: path.join(shots, 'coupon-desktop.png'), fullPage: true });
	await page.getByRole('button', { name: 'Lanjutkan pembayaran', exact: true }).click();
	await page.waitForURL('**/test-checkout/**');
	const buyerRecord = await api(`/api/collections/users/records/${buyer.id}`);
	const payment = (
		await api(
			'/api/collections/payments/records?filter=' +
				encodeURIComponent(`wedding = '${buyerRecord.wedding_id}'`)
		)
	).items[0];
	assert.equal(payment.amount, 45000);
	assert.equal(payment.commission_amount, 9000);
	assert.equal(payment.coupon_code, affiliate.code);
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto(appUrl + '/upgrade');
	await page.getByRole('button', { name: 'Terpasang', exact: true }).waitFor();
	await page.waitForFunction(() =>
		[...document.querySelectorAll('button')].some(
			(button) =>
				button.textContent.trim() === 'Lanjutkan pembayaran' &&
				button.offsetParent !== null &&
				!button.disabled
		)
	);
	await page.screenshot({ path: path.join(shots, 'coupon-mobile.png'), fullPage: true });
	assert.equal(
		await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
		false
	);
	console.log('PASS coupon checkout and restored pending invoice on mobile');
	// Prepare a payable ledger in the disposable fixture using signed mock callbacks.
	// Actual checkout pricing and concurrency are exercised by the API integration suite.
	for (let index = 0; index < 12; index++) {
		const customer = await api('/api/collections/users/records', 'POST', {
			email: `payout-buyer-${suffix}-${index}@example.test`,
			name: 'Payout Buyer',
			password,
			passwordConfirm: password,
			verified: true
		});
		const wedding = await api('/api/collections/weddings/records', 'POST', {
			owner: customer.id,
			theme: 'nocturne',
			plan_tier: 'free'
		});
		const order = `UI-${suffix}-${index}`;
		await api('/api/collections/payments/records', 'POST', {
			wedding: wedding.id,
			provider: 'duitku',
			provider_transaction_id: order,
			amount: 45000,
			original_amount: 50000,
			discount_amount: 5000,
			discount_percent: 10,
			affiliate: affiliate.id,
			coupon_code: affiliate.code,
			commission_basis: 'after_discount',
			commission_percent: 20,
			commission_amount: 9000,
			status: 'pending',
			currency: 'IDR'
		});
		await api(
			'/api/wedez/payments/duitku/callback',
			'POST',
			{
				merchantCode: 'TEST',
				merchantOrderId: order,
				amount: '45000',
				resultCode: '00',
				reference: `ref-${order}`,
				signature: createHmac('sha256', 'fake-duitku-test-key')
					.update('TEST45000' + order)
					.digest('hex')
			},
			''
		);
	}
	await page.goto(appUrl + '/affiliate/dashboard');
	await page
		.getByRole('heading', { name: 'Gabung program affiliate Wedez', exact: true })
		.waitFor();
	await page.getByRole('button', { name: 'Buka menu profil', exact: true }).click();
	await page.getByRole('menuitem', { name: 'Keluar', exact: true }).click();
	await page.waitForURL('**/login');
	await page.getByLabel('Email', { exact: true }).fill(email);
	await page.getByLabel('Kata sandi', { exact: true }).fill(password);
	await page.getByRole('button', { name: 'Masuk', exact: true }).click();
	await page.waitForURL('**/affiliate/dashboard');
	await page.getByRole('button', { name: 'Buka menu', exact: true }).click();
	await page.getByRole('link', { name: 'Pencairan', exact: true }).click();
	await page.getByRole('button', { name: 'Ajukan pencairan', exact: true }).click();
	await page.getByText(/atas nama Affiliate Browser/).waitFor();
	await page.getByRole('button', { name: 'Konfirmasi pencairan', exact: true }).click();
	await page.getByText('Pengajuan pencairan berhasil dikirim.', { exact: true }).waitFor();
	await page.getByText('Diajukan', { exact: true }).waitFor();
	assert.equal(
		await page.getByRole('button', { name: 'Ajukan pencairan', exact: true }).isDisabled(),
		true
	);
	const payouts = (
		await api(
			'/api/collections/affiliate_payouts/records?filter=' +
				encodeURIComponent(`affiliate = '${affiliate.id}'`)
		)
	).items;
	assert.equal(payouts.length, 1);
	assert.equal(payouts[0].amount, 108000);
	assert.equal(payouts[0].account_number, '0012345678');
	await page.screenshot({ path: path.join(shots, 'payout-request-mobile.png'), fullPage: true });
	assert.deepEqual(errors, []);
	console.log(
		`PASS payout confirmation and reservation through the mobile UI; no browser errors. Screenshots: ${shots}`
	);
} catch (error) {
	await page.screenshot({ path: path.join(shots, 'failure.png'), fullPage: true });
	console.error(await page.locator('body').innerText());
	throw error;
} finally {
	await browser.close();
}
